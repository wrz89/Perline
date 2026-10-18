// Logica pura (senza DOM): griglia, generatore motivi, conteggi, lettura per riga.
(function (root) {
  // ---- catalogo Miyuki Delica 11/0 (web/delica.js) ----
  let _idx = null;
  function indice() {
    if (!_idx) { _idx = new Map(); (root.DELICA || []).forEach((r) => _idx.set(r[0], r)); }
    return _idx;
  }
  // "DB 201", "db0201", "201" -> "201"; "DB 22L" -> "22L"; altrimenti null
  function normCodice(s) {
    const m = /^\s*(?:db)?[\s-]*0*(\d+)\s*([a-z]{0,2})\s*$/i.exec(String(s || ''));
    return m ? String(parseInt(m[1], 10)) + m[2].toUpperCase() : null;
  }
  // "201" -> "DB 201" (almeno 3 cifre, come negli schemi: DB 051, DB 1812)
  function fmtCodice(k) {
    const m = /^(\d+)(.*)$/.exec(k);
    return 'DB ' + m[1].padStart(3, '0') + m[2];
  }
  function colore(cod) {
    const k = normCodice(cod), r = k && indice().get(k);
    return r ? { cod: fmtCodice(r[0]), nome: r[1], hex: r[2], fuori: !!r[3] } : null;
  }
  // ricerca per codice (es. "1812", "db 20") o per parole del nome (es. "crystal ab")
  function cerca(q, max) {
    q = String(q || '').trim().toLowerCase();
    if (!q) return [];
    const k = normCodice(q), out = [];
    const toks = q.split(/\s+/);
    for (const r of indice().values()) {
      const nome = r[1].toLowerCase();
      const perCodice = k && (r[0] === k ? 0 : (/^\d/.test(q.replace(/^db[\s-]*/i, '')) && r[0].startsWith(k) ? 1 : 9));
      const perNome = toks.every((t) => nome.indexOf(t) >= 0) ? 2 : 9;
      const rango = Math.min(perCodice === undefined || perCodice === null ? 9 : perCodice, perNome);
      if (rango < 9) out.push([rango, r]);
    }
    out.sort((x, y) => x[0] - y[0] || parseInt(x[1][0], 10) - parseInt(y[1][0], 10));
    return out.slice(0, max || 30).map(([, r]) => ({ cod: fmtCodice(r[0]), nome: r[1], hex: r[2], fuori: !!r[3] }));
  }

  // palette di partenza: i tre colori degli schemi di riferimento (DB 201, DB 051, DB 1812) + uno scuro
  function paletteDefault() {
    const p = ['201', '51', '1812'].map(colore);
    const fb = [{ cod: 'DB 201', nome: 'Chiaro', hex: '#E8E5E7' }, { cod: 'DB 051', nome: 'Medio', hex: '#9FA1AD' }, { cod: 'DB 1812', nome: 'Scuro', hex: '#4C9290' }];
    return p.map((x, i) => ({ ...(x || fb[i]) })).concat([{ cod: '', nome: 'Colore 4', hex: '#2B2B2B' }]);
  }

  // Modelli di riferimento (braccialetti 7/10/16 x 100 degli schemi): rombi alternati scuro (DB 1812) / medio (DB 051)
  // su fondo chiaro (DB 201). dw/dh/tA/tB tarati per riprodurre i conteggi degli schemi (es. 7x100 = 220/200/280 perline).
  const MODELLI = [
    { id: '7x100', nome: 'Braccialetto 7 × 100', w: 7, h: 100, dw: 8, dh: 10, tA: 0.8, tB: 0.8 },
    { id: '10x100', nome: 'Braccialetto 10 × 100', w: 10, h: 100, dw: 9, dh: 11, tA: 0.95, tB: 0.7 },
    { id: '16x100', nome: 'Braccialetto 16 × 100', w: 16, h: 100, dw: 14, dh: 18, tA: 0.95, tB: 0.7 },
  ];
  // palette e griglia di un modello: A = DB 201, B = DB 051, C = DB 1812
  function applicaModello(m) {
    const palette = paletteDefault().slice(0, 3);
    return { palette, w: m.w, h: m.h, celle: rombiAlt(m.w, m.h, { dw: m.dw, dh: m.dh, tA: m.tA, tB: m.tB, a: 2, b: 1, sfondo: 0 }) };
  }

  // ---- foto -> schema ----
  const hex2rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const lum = (hex) => lab(...hex2rgb(hex))[0];
  function lab(r, g, b) {
    const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const R = f(r), G = f(g), B = f(b);
    let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047, y = R * 0.2126 + G * 0.7152 + B * 0.0722, z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
    const t = (v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
    x = t(x); y = t(y); z = t(z);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  }
  const d2 = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;

  // Porta l'immagine {w,h,data RGBA} sulla griglia W x H. Una cella e' larga bw e alta bh (mm): il rettangolo
  // di immagine usato ha le stesse proporzioni del lavoro finito. modo 'riempi' ritaglia al centro, 'adatta' lascia bande vuote.
  function campiona(img, W, H, o) {
    const bw = o.bw || 1.6, bh = o.bh || 1.3, rot = !!o.ruota;
    const iw = rot ? img.h : img.w, ih = rot ? img.w : img.h;
    const A = (W * bw) / (H * bh);
    let rw, rh;
    if (o.modo === 'adatta') { if (iw / ih > A) { rw = iw; rh = iw / A; } else { rh = ih; rw = ih * A; } }
    else { if (iw / ih > A) { rh = ih; rw = ih * A; } else { rw = iw; rh = iw / A; } }
    const x0 = (iw - rw) / 2, y0 = (ih - rh) / 2;
    const rgb = new Float32Array(W * H * 3), vuoto = new Uint8Array(W * H);
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const xa = x0 + (c * rw) / W, xb = x0 + ((c + 1) * rw) / W, ya = y0 + (r * rh) / H, yb = y0 + ((r + 1) * rh) / H;
      const sx0 = Math.max(0, Math.floor(xa)), sx1 = Math.min(iw - 1, Math.max(Math.floor(xa), Math.ceil(xb) - 1));
      const sy0 = Math.max(0, Math.floor(ya)), sy1 = Math.min(ih - 1, Math.max(Math.floor(ya), Math.ceil(yb) - 1));
      const i = r * W + c;
      if (xb <= 0 || xa >= iw || yb <= 0 || ya >= ih) { vuoto[i] = 1; continue; }
      let sr = 0, sg = 0, sb = 0, n = 0;
      for (let y = sy0; y <= sy1; y++) for (let x = sx0; x <= sx1; x++) {
        const [ox, oy] = rot ? [y, img.h - 1 - x] : [x, y];
        const k = (oy * img.w + ox) * 4, a = img.data[k + 3] / 255;
        sr += img.data[k] * a + 255 * (1 - a); sg += img.data[k + 1] * a + 255 * (1 - a); sb += img.data[k + 2] * a + 255 * (1 - a); n++;
      }
      if (!n) { vuoto[i] = 1; continue; }
      rgb[i * 3] = sr / n; rgb[i * 3 + 1] = sg / n; rgb[i * 3 + 2] = sb / n;
    }
    return { rgb, vuoto };
  }

  // Colore piu' vicino (distanza in CIELAB). paletteHex: lista di '#rrggbb'. Restituisce la griglia di indici.
  function quantizza(camp, W, H, paletteHex, o) {
    o = o || {};
    const labs = paletteHex.map((h) => lab(...hex2rgb(h))), rgbs = paletteHex.map(hex2rgb);
    const buf = Float32Array.from(camp.rgb), fattore = 1 + (o.contrasto || 0);
    const piu = (r, g, b) => { const l = lab(r, g, b); let m = 0, md = Infinity; for (let i = 0; i < labs.length; i++) { const d = d2(l, labs[i]); if (d < md) { md = d; m = i; } } return m; };
    const g = nuovaGriglia(W, H, o.sfondo || 0);
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const i = r * W + c;
      if (camp.vuoto[i]) continue;
      const v = [0, 1, 2].map((k) => Math.max(0, Math.min(255, (buf[i * 3 + k] - 128) * fattore + 128)));
      const m = piu(v[0], v[1], v[2]);
      g[r][c] = m;
      if (o.dither) {
        const e = [0, 1, 2].map((k) => v[k] - rgbs[m][k]);
        const dif = (dc, dr, q) => { const cc = c + dc, rr = r + dr; if (cc < 0 || cc >= W || rr >= H || camp.vuoto[rr * W + cc]) return; for (let k = 0; k < 3; k++) buf[(rr * W + cc) * 3 + k] += e[k] * q; };
        dif(1, 0, 7 / 16); dif(-1, 1, 3 / 16); dif(0, 1, 5 / 16); dif(1, 1, 1 / 16);
      }
    }
    return g;
  }

  // centri dei colori dominanti (CIELAB): k-means++ con k fisso
  function centriKmeans(pts, k, seme) {
    k = Math.max(1, Math.min(k, pts.length));
    const rnd = prng(seme || 7), cen = [pts[Math.floor(rnd() * pts.length)]];
    while (cen.length < k) {
      const dist = pts.map((p) => Math.min(...cen.map((q) => d2(p, q)))), tot = dist.reduce((a, b) => a + b, 0);
      if (tot === 0) break;
      let x = rnd() * tot, j = 0; while (j < pts.length - 1 && x >= dist[j]) { x -= dist[j]; j++; }
      cen.push(pts[j]);
    }
    for (let it = 0; it < 15; it++) {
      const somma = cen.map(() => [0, 0, 0, 0]);
      pts.forEach((p) => { let m = 0, md = Infinity; cen.forEach((q, i) => { const d = d2(p, q); if (d < md) { md = d; m = i; } }); const s = somma[m]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++; });
      somma.forEach((s, i) => { if (s[3]) cen[i] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]; });
    }
    return cen;
  }
  // numero di colori automatico (per schemi gia' a quadretti): raggruppa i colori simili e scarta i rari (bordi, sfumature)
  function centriAuto(pts, soglia, max) {
    const cl = [];
    pts.forEach((p) => {
      let m = null, md = soglia * soglia;
      cl.forEach((x) => { const d = d2(p, x.c); if (d < md) { md = d; m = x; } });
      if (m) { m.s[0] += p[0]; m.s[1] += p[1]; m.s[2] += p[2]; m.n++; m.c = [m.s[0] / m.n, m.s[1] / m.n, m.s[2] / m.n]; }
      else cl.push({ c: p.slice(), s: p.slice(), n: 1 });
    });
    const minimo = Math.max(2, Math.ceil(pts.length * 0.012));
    let grandi = cl.filter((x) => x.n >= minimo);
    if (!grandi.length) grandi = cl.slice().sort((a, b) => b.n - a.n).slice(0, 1);
    return grandi.sort((a, b) => b.n - a.n).slice(0, max || 12).map((x) => x.c);
  }
  // abbina i centri ai Delica piu' vicini (distinti, in produzione), dal piu' chiaro al piu' scuro
  function abbinaDelica(cen) {
    const catalogo = Array.from(indice().values()).filter((r) => !r[3]).map((r) => ({ r, l: lab(...hex2rgb(r[2])) }));
    const usati = new Set(), out = [];
    cen.slice().sort((a, b) => b[0] - a[0]).forEach((cl) => {
      const sc = catalogo.map((x) => [d2(cl, x.l), x.r]).sort((a, b) => a[0] - b[0]).find(([, r]) => !usati.has(r[0]));
      if (sc) { usati.add(sc[1][0]); out.push({ cod: fmtCodice(sc[1][0]), nome: sc[1][1], hex: sc[1][2] }); }
    });
    return out;
  }
  // Ricava i colori dall'immagine: k fisso, oppure k = 0 per il numero automatico
  function paletteDaFoto(camp, W, H, k, seme) {
    const pts = [];
    for (let i = 0; i < W * H; i++) if (!camp.vuoto[i]) pts.push(lab(camp.rgb[i * 3], camp.rgb[i * 3 + 1], camp.rgb[i * 3 + 2]));
    if (!pts.length) return [];
    return abbinaDelica(k > 0 ? centriKmeans(pts, k, seme) : centriAuto(pts, 14, 12));
  }

  // ---- schemi gia' a quadretti: rileva la griglia e legge il colore di ogni quadretto ----
  // Cerca il passo (in pixel) dei bordi: prima per autocorrelazione del profilo dei contorni (non risente dei margini),
  // poi affina con un "pettine" di righe equidistanti anche per passi non interi (immagini ridimensionate).
  function trovaPasso(E) {
    const N = E.length, media = E.reduce((a, b) => a + b, 0) / N || 1e-9;
    const Ec = Array.from(E, (v) => v - media), maxLag = Math.min(150, N >> 1);
    const ac = new Float32Array(maxLag + 2);
    for (let l = 1; l <= maxLag; l++) { let s = 0; for (let i = 0; i + l < N; i++) s += Ec[i] * Ec[i + l]; ac[l] = s / (N - l); }
    let top = 0; for (let l = 3; l <= maxLag; l++) if (ac[l] > top) top = ac[l];
    if (top <= 0) return null;
    let p0 = 0;
    for (let l = 3; l < maxLag; l++) if (ac[l] >= ac[l - 1] && ac[l] >= ac[l + 1] && ac[l] >= 0.5 * top) { p0 = l; break; }
    if (!p0) return null;
    const es = new Float32Array(N);
    for (let i = 0; i < N; i++) es[i] = Math.max(E[i], E[i - 1] || 0, E[i + 1] || 0);
    // punteggio del pettine: media del 70% dei picchi piu' forti (ignora i margini senza linee)
    const punt = (p, fase) => { const v = []; for (let x = fase; x < N; x += p) v.push(es[Math.round(x)]); v.sort((a, b) => b - a); const n = Math.max(1, Math.ceil(v.length * 0.7)); let s = 0; for (let i = 0; i < n; i++) s += v[i]; return s / n; };
    let best = [-1, p0, 0];
    for (let p = p0 * 0.94; p <= p0 * 1.06; p += 0.02) for (let f = 0; f < p; f += 0.5) { const s = punt(p, f); if (s > best[0]) best = [s, p, f]; }
    return { p: best[1], fase: best[2], punteggio: best[0] / media, es };
  }
  function estensione(r) { // tratto di linee del pettine che copre il reticolo: massimizza la somma di (picco - soglia) (Kadane)
    const { p, fase, es } = r, N = es.length, hit = [];
    for (let k = 0; fase + k * p < N + p; k++) { const x = Math.round(fase + k * p); hit.push(x >= 0 && x < N ? es[x] : 0); }
    const ord = hit.slice().sort((a, b) => b - a), n = Math.max(1, Math.floor(ord.length * 0.3)), top = ord.slice(0, n), ref = top[top.length >> 1], thr = 0.4 * ref;
    let best = -Infinity, k0 = -1, k1 = -1, cur = 0, s = 0;
    hit.forEach((h, k) => {
      if (cur <= 0) { cur = 0; s = k; }
      cur += h - thr;
      if (cur > best) { best = cur; k0 = s; k1 = k; }
    });
    // le linee ai margini del tratto devono essere vere (non solo "a pareggio")
    while (k0 < k1 && hit[k0] < thr) k0++;
    while (k1 > k0 && hit[k1] < thr) k1--;
    return { k0, k1, riempimento: 1 };
  }
  function rilevaGriglia(img0) {
    // margine bianco: le linee che coincidono con il bordo dell'immagine diventano rilevabili
    const M = 12, w = img0.w + 2 * M, h = img0.h + 2 * M, data = new Uint8ClampedArray(w * h * 4).fill(255);
    for (let y = 0; y < img0.h; y++) for (let x = 0; x < img0.w; x++) { const k = (y * img0.w + x) * 4, o = ((y + M) * w + x + M) * 4; data[o] = img0.data[k]; data[o + 1] = img0.data[k + 1]; data[o + 2] = img0.data[k + 2]; data[o + 3] = img0.data[k + 3]; }
    const L = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) { const a = data[i * 4 + 3] / 255; L[i] = (0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]) * a + 255 * (1 - a); }
    const Ex = new Float32Array(w), Ey = new Float32Array(h);
    for (let y = 0; y < h; y++) for (let x = 1; x < w; x++) Ex[x] += Math.abs(L[y * w + x] - L[y * w + x - 1]) / h;
    for (let y = 1; y < h; y++) for (let x = 0; x < w; x++) Ey[y] += Math.abs(L[y * w + x] - L[(y - 1) * w + x]) / w;
    const rx = trovaPasso(Ex), ry = trovaPasso(Ey);
    if (!rx || !ry) return null;
    // asse con le linee della griglia visibili: serve il tratto con linee. Senza linee (solo cambi di colore):
    // la griglia occupa tutta l'immagine.
    // affina posizione e passo con una retta ai picchi veri (corregge la deriva su griglie lunghe o appena inclinate)
    const affina = (es, x0, p, n) => {
      const ref = Math.max(...es), pts = [];
      for (let k = 0; k <= n; k++) {
        const c0 = x0 + k * p; let bi = -1, bv = 0;
        for (let x = Math.max(1, Math.round(c0 - 0.3 * p)); x <= Math.min(es.length - 2, Math.round(c0 + 0.3 * p)); x++) if (es[x] > bv) { bv = es[x]; bi = x; }
        if (bi >= 0 && bv >= 0.25 * ref) pts.push([k, bi]);
      }
      if (pts.length < 4) return { x0, p };
      const m = pts.length, sk = pts.reduce((a, q) => a + q[0], 0), sx = pts.reduce((a, q) => a + q[1], 0), skk = pts.reduce((a, q) => a + q[0] * q[0], 0), skx = pts.reduce((a, q) => a + q[0] * q[1], 0);
      const den = m * skk - sk * sk; if (!den) return { x0, p };
      const b = (m * skx - sk * sx) / den, a = (sx - b * sk) / m;
      return Math.abs(b - p) < 0.1 * p ? { x0: a, p: b } : { x0, p };
    };
    const asse = (r, N) => {
      const e = estensione(r);
      if (e.k0 >= 0 && e.k1 - e.k0 >= 5) { const x0 = r.fase + e.k0 * r.p, n = e.k1 - e.k0, f = affina(r.es, x0, r.p, n); return { x0: f.x0, n, p: f.p }; }
      const x0 = r.fase > 0.5 * r.p ? r.fase - r.p : r.fase;
      return { x0, n: Math.round((N - x0) / r.p), p: r.p };
    };
    const ax = asse(rx, w), ay = asse(ry, h);
    if (ax.n < 2 || ay.n < 2) return null;
    return { px: ax.p, py: ay.p, x0: ax.x0 - M, y0: ay.x0 - M, cols: ax.n, rows: ay.n, conf: Math.min(rx.punteggio, ry.punteggio) };
  }
  // colore di ogni quadretto = mediana della zona centrale (insensibile alle linee della griglia)
  function leggiQuadretti(img, g) {
    const { w, h, data } = img, rgb = new Float32Array(g.cols * g.rows * 3), vuoto = new Uint8Array(g.cols * g.rows);
    const med = (v) => { v.sort((a, b) => a - b); return v[v.length >> 1]; };
    for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) {
      const xa = Math.round(g.x0 + (c + 0.3) * g.px), xb = Math.max(xa, Math.round(g.x0 + (c + 0.7) * g.px));
      const ya = Math.round(g.y0 + (r + 0.3) * g.py), yb = Math.max(ya, Math.round(g.y0 + (r + 0.7) * g.py));
      const R = [], G = [], B = [];
      for (let y = Math.max(0, ya); y <= Math.min(h - 1, yb); y++) for (let x = Math.max(0, xa); x <= Math.min(w - 1, xb); x++) {
        const k = (y * w + x) * 4, a = data[k + 3] / 255;
        R.push(data[k] * a + 255 * (1 - a)); G.push(data[k + 1] * a + 255 * (1 - a)); B.push(data[k + 2] * a + 255 * (1 - a));
      }
      const i = r * g.cols + c;
      if (!R.length) { vuoto[i] = 1; continue; }
      rgb[i * 3] = med(R); rgb[i * 3 + 1] = med(G); rgb[i * 3 + 2] = med(B);
    }
    return { rgb, vuoto };
  }

  // Misure indicative (mm, larghezza x lunghezza) dei Delica: variano un po' tra fonti e lotti, quindi sono modificabili.
  const PERLINE = [
    { id: '15', nome: 'Delica 15/0', bw: 1.3, bh: 1.15 },
    { id: '11', nome: 'Delica 11/0', bw: 1.6, bh: 1.3 },
    { id: '10', nome: 'Delica 10/0', bw: 2.1, bh: 1.7 },
    { id: '8', nome: 'Delica 8/0', bw: 3.0, bh: 2.7 },
  ];
  // Per una foto da far stare su una larghezza (mm) calcola, per ogni misura di perlina, colonne x righe a foto intera.
  // dettaglio = colonne minime desiderate: la consigliata e' la perlina piu' grande che le raggiunge (altrimenti la piu' piccola).
  function opzioniFoto(larghezzaMm, iw, ih, misure, dettaglio) {
    const out = misure.map((m) => {
      const cols = Math.max(1, Math.round(larghezzaMm / m.bw)), rows = Math.max(1, Math.round((larghezzaMm * ih) / iw / m.bh));
      return { ...m, cols, rows, tot: cols * rows, lungCm: (rows * m.bh) / 10 };
    });
    const ok = out.filter((o) => o.cols >= dettaglio).sort((a, b) => b.bw - a.bw)[0] || out.slice().sort((a, b) => a.bw - b.bw)[0];
    out.forEach((o) => { o.consigliata = o === ok; });
    return out;
  }

  // ---- libreria motivi: ripete un motivo (o un tassello) su una griglia w x h ----
  // o: { c1, c2, c3, sfondo } indici palette; scala (1-4 oppure 'auto'); gap = righe vuote tra le ripetizioni; bordo = colonne ai lati in c1;
  // adatta (predefinito: si') = il numero di righe viene riempito esattamente: ripetizioni intere, margini uguali sopra e sotto.
  // Periodo di un motivo che si ripete, ridotto/allungato perche' in h righe ci stia un numero intero di periodi.
  function adattaPeriodo(p, h) { return h / Math.max(1, Math.round(h / p)); }
  function applicaMotivo(m, w, h, o) {
    const adatta = o.adatta !== false, m0 = m.righe, mw0 = m0[0].length;
    let sc = o.scala === 'auto' ? 1 : Math.max(1, (o.scala | 0) || 1);
    if (o.scala === 'auto') { while (sc < 4 && mw0 * (sc + 1) <= w && m0.length * (sc + 1) <= h && (m.tipo !== 'periodico')) sc++; }
    const col = { '.': o.sfondo, 1: o.c1, 2: o.c2, 3: o.c3 };
    const base = m0.map((r) => r.split('').flatMap((ch) => Array(sc).fill(col[ch]))).flatMap((r) => Array(sc).fill(r));
    const mw = base[0].length, mh = base.length, g = nuovaGriglia(w, h, o.sfondo);
    if (m.tipo === 'periodico') {
      const sx = Math.floor((w - 1) / 2 - (mw - 1) / 2), n = Math.max(1, Math.round(h / mh));
      for (let r = 0; r < h; r++) {
        const rs = adatta ? Math.floor(((r + 0.5) * n * mh) / h) % mh : r % mh;
        for (let c = 0; c < w; c++) g[r][c] = base[rs][(((c - sx) % mw) + mw) % mw];
      }
    } else {
      const gap = Math.max(0, o.gap === undefined ? m.gap || 2 : o.gap), gapX = Math.max(1, Math.round(gap / 2) + 1);
      const k = mw > w ? 1 : Math.max(1, Math.floor((w + gapX) / (mw + gapX)));
      const larg = k * mw + (k - 1) * gapX, x0 = Math.floor((w - larg) / 2);
      let tops;
      if (adatta) { // n ripetizioni intere, spazio avanzato diviso in parti uguali (con meta' sopra e sotto)
        let best = 1, bc = Infinity;
        for (let n = 1; n <= Math.max(1, Math.floor(h / mh)); n++) { const cost = Math.abs(h / n - mh - gap); if (cost <= bc) { bc = cost; best = n; } }
        const pas = h / best, ge = pas - mh;
        tops = Array.from({ length: best }, (_, i) => Math.round(i * pas + ge / 2));
      } else { tops = []; for (let y0 = Math.floor(gap / 2); y0 < h; y0 += mh + gap) tops.push(y0); }
      tops.forEach((y0) => { for (let i = 0; i < k; i++) {
        for (let r = 0; r < mh && y0 + r < h; r++) for (let c = 0; c < mw; c++) {
          const x = x0 + i * (mw + gapX) + c;
          if (x >= 0 && x < w && y0 + r >= 0) g[y0 + r][x] = base[r][c];
        }
      } });
    }
    for (let b = 0; b < (o.bordo | 0); b++) for (let r = 0; r < h; r++) { if (b < w) { g[r][b] = o.c1; g[r][w - 1 - b] = o.c1; } }
    return g;
  }

  // ---- migliorie per le foto ----
  // Prima della scelta dei colori: livelli automatici, saturazione, nitidezza e appiattimento dello sfondo (sulle celle campionate).
  function migliora(camp, W, H, o) {
    const rgb = camp.rgb, idx = []; for (let i = 0; i < W * H; i++) if (!camp.vuoto[i]) idx.push(i);
    if (!idx.length) return camp;
    const luma = (i) => 0.299 * rgb[i * 3] + 0.587 * rgb[i * 3 + 1] + 0.114 * rgb[i * 3 + 2];
    if (o.livelli) { // stira l'istogramma tra il 1% e il 99%
      const L = idx.map(luma).sort((a, b) => a - b), lo = L[Math.floor(L.length * 0.01)], hi = L[Math.min(L.length - 1, Math.floor(L.length * 0.99))];
      if (hi - lo > 20) idx.forEach((i) => { for (let k = 0; k < 3; k++) rgb[i * 3 + k] = Math.max(0, Math.min(255, ((rgb[i * 3 + k] - lo) * 255) / (hi - lo))); });
    }
    if (o.nitidezza > 0) { // maschera di contrasto 3x3
      const src = Float32Array.from(rgb);
      for (let r = 0; r < H; r++) for (let cc = 0; cc < W; cc++) {
        const i = r * W + cc; if (camp.vuoto[i]) continue;
        for (let k = 0; k < 3; k++) {
          let s = 0, n = 0;
          for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const rr = r + dr, c2 = cc + dc; if (rr < 0 || rr >= H || c2 < 0 || c2 >= W || camp.vuoto[rr * W + c2]) continue; s += src[(rr * W + c2) * 3 + k]; n++; }
          rgb[i * 3 + k] = Math.max(0, Math.min(255, src[i * 3 + k] + o.nitidezza * (src[i * 3 + k] - s / n)));
        }
      }
    }
    if (o.saturazione) idx.forEach((i) => { const g = luma(i); for (let k = 0; k < 3; k++) rgb[i * 3 + k] = Math.max(0, Math.min(255, g + (rgb[i * 3 + k] - g) * (1 + o.saturazione))); });
    if (o.sfondo) { // colore dei bordi = sfondo; le celle collegate al bordo e simili diventano tutte uguali
      const bordo = []; for (let r = 0; r < H; r++) for (let cc = 0; cc < W; cc++) if ((r === 0 || cc === 0 || r === H - 1 || cc === W - 1) && !camp.vuoto[r * W + cc]) bordo.push(r * W + cc);
      const med = (k) => { const v = bordo.map((i) => rgb[i * 3 + k]).sort((a, b) => a - b); return v[v.length >> 1]; };
      const bg = [med(0), med(1), med(2)], lb = lab(...bg), soglia = (o.soglia || 16) ** 2, vis = new Uint8Array(W * H), pila = bordo.slice();
      while (pila.length) {
        const i = pila.pop(); if (vis[i] || camp.vuoto[i]) continue;
        if (d2(lab(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]), lb) > soglia) continue;
        vis[i] = 1; const r = (i / W) | 0, cc = i % W;
        if (r > 0) pila.push(i - W); if (r < H - 1) pila.push(i + W); if (cc > 0) pila.push(i - 1); if (cc < W - 1) pila.push(i + 1);
      }
      for (let i = 0; i < W * H; i++) if (vis[i]) { rgb[i * 3] = bg[0]; rgb[i * 3 + 1] = bg[1]; rgb[i * 3 + 2] = bg[2]; }
    }
    return camp;
  }
  // Dopo la scelta dei colori: toglie le perline isolate (nessun vicino uguale) usando il colore piu' frequente intorno.
  function pulisci(g, passate) {
    const H = g.length, W = g[0].length;
    for (let p = 0; p < (passate | 0); p++) {
      const nuovo = g.map((r) => r.slice());
      for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
        const cnt = new Map(); let uguali = 0, tot = 0;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue; const rr = r + dr, cc = c + dc; if (rr < 0 || rr >= H || cc < 0 || cc >= W) continue;
          tot++; const v = g[rr][cc]; cnt.set(v, (cnt.get(v) || 0) + 1); if (v === g[r][c]) uguali++;
        }
        if (uguali <= 1 && tot >= 3) { let b = g[r][c], bn = 0; cnt.forEach((n, v) => { if (n > bn) { bn = n; b = v; } }); if (bn >= 3) nuovo[r][c] = b; }
      }
      for (let r = 0; r < H; r++) g[r] = nuovo[r];
    }
    return g;
  }

  // ---- raddrizzare le immagini (foto di sbieco / inclinate) ----
  function campione(img, x, y) { // interpolazione bilineare, fuori dall'immagine = bianco
    const { w, h, data } = img;
    if (x < -0.5 || y < -0.5 || x > w - 0.5 || y > h - 0.5) return [255, 255, 255, 255];
    const x0 = Math.max(0, Math.min(w - 2, Math.floor(x))), y0 = Math.max(0, Math.min(h - 2, Math.floor(y))), fx = Math.max(0, Math.min(1, x - x0)), fy = Math.max(0, Math.min(1, y - y0));
    const o = [0, 0, 0, 0];
    for (let k = 0; k < 4; k++) {
      const a = data[(y0 * w + x0) * 4 + k], b = data[(y0 * w + x0 + 1) * 4 + k], cc = data[((y0 + 1) * w + x0) * 4 + k], d = data[((y0 + 1) * w + x0 + 1) * 4 + k];
      o[k] = a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + cc * (1 - fx) * fy + d * fx * fy;
    }
    return o;
  }
  // ruota l'immagine di `gradi` (senza tagliare i bordi)
  function ruota(img, gradi) {
    const t = (gradi * Math.PI) / 180, cs = Math.cos(t), sn = Math.sin(t);
    const W = Math.ceil(Math.abs(img.w * cs) + Math.abs(img.h * sn)), H = Math.ceil(Math.abs(img.w * sn) + Math.abs(img.h * cs));
    const out = { w: W, h: H, data: new Uint8ClampedArray(W * H * 4) };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = x - (W - 1) / 2, dy = y - (H - 1) / 2, sx = dx * cs + dy * sn + (img.w - 1) / 2, sy = -dx * sn + dy * cs + (img.h - 1) / 2;
      const p = campione(img, sx, sy), k = (y * W + x) * 4; out.data[k] = p[0]; out.data[k + 1] = p[1]; out.data[k + 2] = p[2]; out.data[k + 3] = p[3];
    }
    return out;
  }
  function riduci(img, lato) { // riduzione a campionamento (per le stime veloci)
    const f = Math.max(1, Math.ceil(Math.max(img.w, img.h) / lato)), w = Math.floor(img.w / f), h = Math.floor(img.h / f), L = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let j = 0; j < f; j++) for (let i = 0; i < f; i++) { const k = ((y * f + j) * img.w + x * f + i) * 4; s += 0.299 * img.data[k] + 0.587 * img.data[k + 1] + 0.114 * img.data[k + 2]; } L[y * w + x] = s / (f * f); }
    return { w, h, L };
  }
  // angolo (gradi) che rende orizzontali e verticali le linee: massimizza la "spigolosita'" dei profili dei contorni
  function stimaAngolo(img, max) {
    const pic = riduci(img, 260), { w, h, L } = pic, cx = (w - 1) / 2, cy = (h - 1) / 2, mx = Math.floor(w * 0.12), my = Math.floor(h * 0.12);
    const punteggio = (gr) => {
      const t = (gr * Math.PI) / 180, cs = Math.cos(t), sn = Math.sin(t), g = new Float32Array(w * h);
      for (let y = my; y < h - my; y++) for (let x = mx; x < w - mx; x++) {
        const dx = x - cx, dy = y - cy, sx = Math.round(dx * cs + dy * sn + cx), sy = Math.round(-dx * sn + dy * cs + cy);
        g[y * w + x] = sx >= 0 && sx < w && sy >= 0 && sy < h ? L[sy * w + sx] : 255;
      }
      const Ex = new Float32Array(w), Ey = new Float32Array(h);
      for (let y = my + 1; y < h - my - 1; y++) for (let x = mx + 1; x < w - mx - 1; x++) { Ex[x] += Math.abs(g[y * w + x] - g[y * w + x - 1]); Ey[y] += Math.abs(g[y * w + x] - g[(y - 1) * w + x]); }
      const v = (E, a, b) => { let m = 0, n = b - a; for (let i = a; i < b; i++) m += E[i]; m /= n; let s = 0; for (let i = a; i < b; i++) s += (E[i] - m) ** 2; return s / n / (m * m + 1e-9); };
      return v(Ex, mx + 1, w - mx - 1) + v(Ey, my + 1, h - my - 1);
    };
    let best = 0, bs = punteggio(0);
    for (let gr = -max; gr <= max; gr += 1) { const s = punteggio(gr); if (s > bs * 1.02) { bs = s; best = gr; } }
    for (let gr = best - 0.75; gr <= best + 0.75; gr += 0.25) { const s = punteggio(gr); if (s > bs) { bs = s; best = gr; } }
    return best;
  }
  // omografia: porta il rettangolo uscita (0,0)-(W,H) sul quadrilatero q = [TL, TR, BR, BL] dell'immagine
  function omografia(q, W, H) {
    const dst = [[0, 0], [W - 1, 0], [W - 1, H - 1], [0, H - 1]], A = [], b = [];
    for (let i = 0; i < 4; i++) {
      const [x, y] = dst[i], [u, v] = q[i];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
    }
    for (let i = 0; i < 8; i++) { // eliminazione di Gauss
      let p = i; for (let r = i + 1; r < 8; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
      [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]];
      for (let r = i + 1; r < 8; r++) { const f = A[r][i] / A[i][i]; for (let k = i; k < 8; k++) A[r][k] -= f * A[i][k]; b[r] -= f * b[i]; }
    }
    const h = Array(8).fill(0);
    for (let i = 7; i >= 0; i--) { let s = b[i]; for (let k = i + 1; k < 8; k++) s -= A[i][k] * h[k]; h[i] = s / A[i][i]; }
    return h;
  }
  // ordina 4 punti in TL, TR, BR, BL
  function ordinaAngoli(p) {
    const s = p.map(([x, y]) => x + y), d = p.map(([x, y]) => x - y);
    return [p[s.indexOf(Math.min(...s))], p[d.indexOf(Math.max(...d))], p[s.indexOf(Math.max(...s))], p[d.indexOf(Math.min(...d))]];
  }
  function raddrizza(img, punti, maxLato) {
    const q = ordinaAngoli(punti), dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    let W = Math.round(Math.max(dist(q[0], q[1]), dist(q[3], q[2]))), H = Math.round(Math.max(dist(q[0], q[3]), dist(q[1], q[2])));
    const k = Math.min(1, (maxLato || 900) / Math.max(W, H)); W = Math.max(2, Math.round(W * k)); H = Math.max(2, Math.round(H * k));
    const h = omografia(q, W, H), out = { w: W, h: H, data: new Uint8ClampedArray(W * H * 4) };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const z = h[6] * x + h[7] * y + 1, sx = (h[0] * x + h[1] * y + h[2]) / z, sy = (h[3] * x + h[4] * y + h[5]) / z, p = campione(img, sx, sy), i = (y * W + x) * 4;
      out.data[i] = p[0]; out.data[i + 1] = p[1]; out.data[i + 2] = p[2]; out.data[i + 3] = p[3];
    }
    return out;
  }
  // rilevamento griglia robusto: prova anche a correggere l'inclinazione
  // quota di quadretti con l'interno uniforme: una griglia vera ~1, una rilevata per caso (foto, prospettiva) molto meno
  function qualitaGriglia(img, g) {
    let ok = 0, tot = 0;
    for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) {
      const xa = Math.round(g.x0 + (c + 0.3) * g.px), xb = Math.max(xa, Math.round(g.x0 + (c + 0.7) * g.px)), ya = Math.round(g.y0 + (r + 0.3) * g.py), yb = Math.max(ya, Math.round(g.y0 + (r + 0.7) * g.py));
      let s = 0, s2 = 0, n = 0;
      for (let y = Math.max(0, ya); y <= Math.min(img.h - 1, yb); y++) for (let x = Math.max(0, xa); x <= Math.min(img.w - 1, xb); x++) { const k = (y * img.w + x) * 4, l = 0.299 * img.data[k] + 0.587 * img.data[k + 1] + 0.114 * img.data[k + 2]; s += l; s2 += l * l; n++; }
      if (!n) continue; tot++;
      if (Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2)) < 20) ok++;
    }
    return tot ? ok / tot : 0;
  }
  function rilevaGrigliaRobusta(img) {
    const prova = (im) => { const g = rilevaGriglia(im); return g && g.conf >= 3 && g.cols >= 4 && g.rows >= 4 && qualitaGriglia(im, g) >= 0.9 ? { g, img: im } : null; };
    const ang = stimaAngolo(img, 12);
    if (Math.abs(ang) >= 0.75) { const r = prova(ruota(img, ang)); if (r) return { ...r, angolo: ang }; }
    const r0 = prova(img);
    return r0 ? { ...r0, angolo: 0 } : null;
  }

  // PRNG con seme (mulberry32): stesso seme = stesso disegno
  function prng(seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // colori: indici palette ammessi; blocco: lato dei blocchi (1 = perlina singola);
  // simm: 'nessuna' | 'orizz' (specchio sinistra/destra) | 'orizz-vert' (specchio anche in verticale);
  // modulo: se >0 genera solo `modulo` righe e le ripete; pesi: opzionale, un peso per colore.
  function casuale(w, h, o) {
    const rnd = prng(o.seme), col = o.colori, B = Math.max(1, o.blocco | 1);
    const pesi = o.pesi || col.map(() => 1), tot = pesi.reduce((a, b) => a + b, 0);
    const scegli = () => { let x = rnd() * tot, i = 0; while (i < col.length - 1 && x >= pesi[i]) { x -= pesi[i]; i++; } return col[i]; };
    const righe = o.modulo > 0 ? Math.min(h, o.modulo) : h;
    const bw = Math.ceil(w / B), bh = Math.ceil(righe / B);
    const blocchi = Array.from({ length: bh }, () => Array.from({ length: bw }, scegli));
    const g = Array.from({ length: righe }, (_, r) => Array.from({ length: w }, (_, c) => blocchi[Math.floor(r / B)][Math.floor(c / B)]));
    if (o.simm === 'orizz' || o.simm === 'orizz-vert') {
      for (let r = 0; r < righe; r++) for (let c = 0; c < Math.floor(w / 2); c++) g[r][w - 1 - c] = g[r][c];
    }
    if (o.simm === 'orizz-vert') {
      for (let r = 0; r < Math.floor(righe / 2); r++) g[righe - 1 - r] = g[r].slice();
    }
    return o.modulo > 0 ? ripetiModuloGriglia(g, righe, h) : g;
  }
  function ripetiModuloGriglia(g, p, h) { return Array.from({ length: h }, (_, r) => g[r % p].slice()); }


  const lettera = (i) => String.fromCharCode(65 + i); // A, B, C...

  function nuovaGriglia(w, h, fill) {
    return Array.from({ length: h }, () => Array(w).fill(fill || 0));
  }

  function ridimensiona(celle, w, h, fill) {
    return Array.from({ length: h }, (_, r) =>
      Array.from({ length: w }, (_, c) => (celle[r] && celle[r][c] !== undefined ? celle[r][c] : fill || 0)));
  }

  // Rombi alternati a reticolo (come negli schemi di riferimento): rombi del colore A e del colore B
  // sfalsati di mezzo passo, con i bordi in colore di sfondo. dw/dh = larghezza/altezza di un rombo in perline/righe;
  // tA/tB = quanto e' pieno il rombo (1 = i rombi si toccano).
  function rombiAlt(w, h, o) {
    const dw = Math.max(2, o.dw), dh = Math.max(2, o.dh);
    const cx0 = (w - 1) / 2, cy0 = (dh - 1) / 2;
    const piega = (v, p) => { v = ((v % p) + p) % p; return v > p / 2 ? p - v : v; };
    const g = nuovaGriglia(w, h, o.sfondo);
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
      const dA = piega(c - cx0, dw) / (dw / 2) + piega(r - cy0, dh) / (dh / 2);
      const dB = piega(c - cx0 - dw / 2, dw) / (dw / 2) + piega(r - cy0 - dh / 2, dh) / (dh / 2);
      if (dA <= o.tA && dA <= dB) g[r][c] = o.a;
      else if (dB <= o.tB) g[r][c] = o.b;
    }
    return g;
  }

  // rings: indici palette dal centro verso lo sfondo
  function genera(tipo, w, h, p, rings, extra) {
    const n = rings.length;
    if (tipo === 'rombi-alt') {
      const e = extra || {};
      return rombiAlt(w, h, { dw: e.dw || w, dh: e.dh || Math.round((e.dw || w) * 1.23), tA: e.tA || 0.9, tB: e.tB || 0.75, a: rings[0], b: rings[1], sfondo: rings[n - 1] });
    }
    const g = nuovaGriglia(w, h, rings[n - 1]);
    const cx = (w - 1) / 2;
    for (let r = 0; r < h; r++) {
      const ry = r % p;
      for (let c = 0; c < w; c++) {
        const dc = Math.abs(c - cx);
        let k;
        if (tipo === 'rombi') {
          const dr = Math.abs(ry - (p - 1) / 2);
          const t = dc / (w / 2) + dr / (p / 2);
          k = Math.min(n - 1, Math.floor(t / 0.28));
        } else if (tipo === 'chevron') {
          const slope = Math.max(1, p / Math.max(1, w / 2));
          const pos = (((ry + Math.round(dc * slope)) % p) + p) % p;
          k = Math.min(n - 1, Math.floor((pos / p) * n));
        } else { // righe
          k = Math.min(n - 1, Math.floor((ry / p) * n));
        }
        g[r][c] = rings[k];
      }
    }
    return g;
  }

  // ripete le prime p righe fino a h righe
  function ripetiModulo(celle, p, h) {
    const w = celle[0].length;
    return Array.from({ length: h }, (_, r) => celle[r % p].slice(0, w));
  }

  function conteggi(celle, nColori) {
    const out = Array(nColori).fill(0);
    celle.forEach((riga) => riga.forEach((v) => { if (v < nColori) out[v]++; }));
    return out;
  }

  // "rp." come negli schemi di riferimento: perline / perline-per-rp (es. 220 -> 1,1)
  function rp(perline, perRp) { return perRp > 0 ? perline / perRp : 0; }

  // Telaio: ordito = w+1 fili lunghi (lavoro + sprechi), trama = 1 filo che attraversa ogni riga andata e ritorno.
  // Peyote: un solo filo, stima = lunghezza x fattore. Tutte stime, parametri in opz.
  function stimaMisure(w, h, opz, tecnica) {
    const largMm = w * opz.larghezzaMm, lungMm = h * opz.altezzaMm;
    const out = { largMm, lungMm };
    if (tecnica === 'telaio') {
      out.fiiOrdito = w + 1;
      out.ordCm = Math.round(lungMm / 10 + opz.spreccoOrditoCm);
      out.tramaCm = Math.round((h * (largMm * 2 + opz.extraTramaMm)) / 10 + opz.margineCm);
      out.filoCm = out.tramaCm;
    } else {
      out.filoCm = Math.round((lungMm * opz.fattoreFilo) / 10 + opz.margineCm);
    }
    return out;
  }

  // "A3 B A2" per ogni riga (run-length)
  function lettura(riga) {
    const parti = [];
    let i = 0;
    while (i < riga.length) {
      let j = i;
      while (j < riga.length && riga[j] === riga[i]) j++;
      parti.push(lettera(riga[i]) + (j - i > 1 ? j - i : ''));
      i = j;
    }
    return parti.join(' ');
  }

  function riempi(celle, r, c, nuovo) {
    const vecchio = celle[r][c];
    if (vecchio === nuovo) return;
    const h = celle.length, w = celle[0].length, pila = [[r, c]];
    while (pila.length) {
      const [y, x] = pila.pop();
      if (y < 0 || y >= h || x < 0 || x >= w || celle[y][x] !== vecchio) continue;
      celle[y][x] = nuovo;
      pila.push([y + 1, x], [y - 1, x], [y, x + 1], [y, x - 1]);
    }
  }

  const api = { normCodice, fmtCodice, colore, cerca, paletteDefault, migliora, pulisci, qualitaGriglia, ruota, stimaAngolo, omografia, raddrizza, rilevaGrigliaRobusta, adattaPeriodo, applicaMotivo, PERLINE, opzioniFoto, lum, campiona, quantizza, paletteDaFoto, rilevaGriglia, leggiQuadretti, MODELLI, applicaModello, rombiAlt, prng, casuale, lettera, nuovaGriglia, ridimensiona, genera, ripetiModulo, conteggi, rp, stimaMisure, lettura, riempi };
  if (typeof module !== 'undefined') module.exports = api; else root.Core = api;
})(typeof window !== 'undefined' ? window : globalThis);
