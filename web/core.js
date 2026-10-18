// Logica pura (senza DOM): griglia, generatore motivi, conteggi, lettura per riga.
(function (root) {
  const DEFAULT_PALETTE = [
    { cod: 'DB 201', nome: 'Chiaro', hex: '#f4f4f2' },
    { cod: 'DB 051', nome: 'Medio', hex: '#b9b9b9' },
    { cod: 'DB 1812', nome: 'Scuro', hex: '#6a6a6c' },
    { cod: '', nome: 'Colore 4', hex: '#2b2b2b' },
  ];

  // Libreria di colori generici (nomi e tinte indicative, NON codici Delica): il codice DB lo inserisci tu.
  const LIBRERIA = [
    ['Bianco', '#f5f5f0'], ['Avorio', '#efe6cf'], ['Crema', '#e8d9b0'], ['Grigio chiaro', '#c4c4c4'],
    ['Grigio', '#8c8c8c'], ['Grigio scuro', '#5a5a5c'], ['Nero', '#1c1c1c'], ['Argento', '#b8bcc2'],
    ['Oro', '#c9a227'], ['Bronzo', '#8c6a3a'], ['Marrone', '#6b4226'], ['Beige', '#cdb48a'],
    ['Rosa chiaro', '#f4c2cf'], ['Rosa', '#e46f98'], ['Fucsia', '#c2185b'], ['Rosso', '#c62828'],
    ['Bordeaux', '#7b1e2b'], ['Arancione', '#ef7d1a'], ['Corallo', '#f0816a'], ['Giallo', '#f2c818'],
    ['Verde chiaro', '#a8d672'], ['Verde', '#3a9b4a'], ['Verde scuro', '#1f5a3a'], ['Acqua', '#8fd6cf'],
    ['Turchese', '#1aa7a8'], ['Azzurro', '#7db9e8'], ['Blu', '#2a5db0'], ['Blu notte', '#1b2a56'],
    ['Lilla', '#b9a1d9'], ['Viola', '#6a3d9a'],
  ].map(([nome, hex]) => ({ cod: '', nome, hex }));

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

  // rings: indici palette dal centro verso lo sfondo
  function genera(tipo, w, h, p, rings) {
    const n = rings.length;
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

  const api = { LIBRERIA, prng, casuale, DEFAULT_PALETTE, lettera, nuovaGriglia, ridimensiona, genera, ripetiModulo, conteggi, rp, stimaMisure, lettura, riempi };
  if (typeof module !== 'undefined') module.exports = api; else root.Core = api;
})(typeof window !== 'undefined' ? window : globalThis);
