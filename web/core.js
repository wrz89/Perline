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

  // Ricava k colori dall'immagine (k-means in CIELAB sulle celle) e li abbina ai Delica piu' vicini (distinti, in produzione).
  function paletteDaFoto(camp, W, H, k, seme) {
    const pts = [];
    for (let i = 0; i < W * H; i++) if (!camp.vuoto[i]) pts.push(lab(camp.rgb[i * 3], camp.rgb[i * 3 + 1], camp.rgb[i * 3 + 2]));
    if (!pts.length) return [];
    k = Math.max(1, Math.min(k, pts.length));
    const rnd = prng(seme || 7), cen = [pts[Math.floor(rnd() * pts.length)]];
    while (cen.length < k) { // k-means++
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
    const catalogo = Array.from(indice().values()).filter((r) => !r[3]).map((r) => ({ r, l: lab(...hex2rgb(r[2])) }));
    const usati = new Set(), out = [];
    cen.sort((a, b) => b[0] - a[0]).forEach((cl) => {
      const ord = catalogo.map((x) => [d2(cl, x.l), x.r]).sort((a, b) => a[0] - b[0]);
      const sc = ord.find(([, r]) => !usati.has(r[0]));
      if (sc) { usati.add(sc[1][0]); out.push({ cod: fmtCodice(sc[1][0]), nome: sc[1][1], hex: sc[1][2] }); }
    });
    return out;
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

  const api = { normCodice, fmtCodice, colore, cerca, paletteDefault, PERLINE, opzioniFoto, lum, campiona, quantizza, paletteDaFoto, MODELLI, applicaModello, rombiAlt, prng, casuale, lettera, nuovaGriglia, ridimensiona, genera, ripetiModulo, conteggi, rp, stimaMisure, lettura, riempi };
  if (typeof module !== 'undefined') module.exports = api; else root.Core = api;
})(typeof window !== 'undefined' ? window : globalThis);
