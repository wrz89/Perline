const assert = require('assert');
require('../web/delica.js');
const C = require('../web/core.js');

// lettura run-length
assert.strictEqual(C.lettura([0, 0, 0, 1, 0, 0]), 'A3 B A2');

// conteggi e rp (perline per rp = 200, come negli schemi di riferimento: 220 -> 1,1)
assert.deepStrictEqual(C.conteggi([[0, 1], [1, 1]], 3), [1, 3, 0]);
assert.strictEqual(C.rp(220, 200).toFixed(1), '1.1');

// rombi: simmetrici in orizzontale, usano solo i colori richiesti
const g = C.genera('rombi', 10, 28, 14, [2, 1, 0, 0]);
assert.strictEqual(g.length, 28); assert.strictEqual(g[0].length, 10);
g.forEach((r) => assert.deepStrictEqual(r, r.slice().reverse()));
assert.ok(g.flat().every((v) => [0, 1, 2].includes(v)));
assert.ok(g.flat().includes(2), 'il centro del rombo deve usare il colore 2');
// il modulo si ripete ogni 14 righe
assert.deepStrictEqual(g[0], g[14]);

// ripeti modulo
const m = C.ripetiModulo([[0, 1], [1, 0]], 2, 5);
assert.strictEqual(m.length, 5); assert.deepStrictEqual(m[4], [0, 1]);

// riempi
const f = [[0, 0, 1], [0, 1, 1]];
C.riempi(f, 0, 0, 2);
assert.deepStrictEqual(f, [[2, 2, 1], [2, 1, 1]]);

// ridimensiona conserva i dati
assert.deepStrictEqual(C.ridimensiona([[1]], 2, 2, 0), [[1, 0], [0, 0]]);
// telaio: 10 perline -> 11 fili di ordito
const mt = C.stimaMisure(10, 100, { larghezzaMm: 1.6, altezzaMm: 1.3, fattoreFilo: 4, margineCm: 30, spreccoOrditoCm: 40, extraTramaMm: 10 }, 'telaio');
assert.strictEqual(mt.fiiOrdito, 11); assert.strictEqual(mt.ordCm, 53); assert.ok(mt.tramaCm > 0);
// casuale: stesso seme = stesso disegno, colori ammessi, simmetria, modulo
const o = { colori: [0, 2], seme: 42, blocco: 1, simm: 'orizz', modulo: 0 };
const r1 = C.casuale(9, 20, o), r2 = C.casuale(9, 20, o);
assert.deepStrictEqual(r1, r2);
assert.notDeepStrictEqual(r1, C.casuale(9, 20, { ...o, seme: 43 }));
assert.ok(r1.flat().every((v) => v === 0 || v === 2));
r1.forEach((r) => assert.deepStrictEqual(r, r.slice().reverse()));
const rm = C.casuale(8, 30, { ...o, modulo: 6, simm: 'orizz-vert' });
assert.strictEqual(rm.length, 30); assert.deepStrictEqual(rm[0], rm[6]);
assert.deepStrictEqual(rm[0], rm[5]); // specchio verticale nel modulo
const rb = C.casuale(8, 8, { ...o, blocco: 2, simm: 'nessuna' });
assert.deepStrictEqual(rb[0], rb[1]);
// catalogo Delica
assert.strictEqual(C.normCodice('DB 201'), '201'); assert.strictEqual(C.normCodice('db0051'), '51'); assert.strictEqual(C.normCodice('rosso'), null);
assert.strictEqual(C.colore('DB 1812').cod, 'DB 1812'); assert.strictEqual(C.colore('51').cod, 'DB 051');
assert.ok(C.colore('DB 201').hex.startsWith('#')); assert.strictEqual(C.colore('DB 99999'), null);
assert.ok(C.cerca('crystal ab', 5).length > 0); assert.strictEqual(C.cerca('1812', 3)[0].cod, 'DB 1812');
assert.ok(DELICA.length > 1000);
// modelli: i conteggi del 7x100 coincidono con lo schema di riferimento (220 / 200 / 280)
const mo = C.applicaModello(C.MODELLI[0]);
assert.deepStrictEqual(C.conteggi(mo.celle, 3), [220, 200, 280]);
for (const m of C.MODELLI) { const x = C.applicaModello(m); assert.strictEqual(x.celle.length, 100); assert.strictEqual(x.celle[0].length, m.w);
  x.celle.forEach((r) => assert.deepStrictEqual(r, r.slice().reverse())); }
// foto -> schema: immagine sintetica 40x20 meta' rossa meta' blu
const img = { w: 40, h: 20, data: new Uint8ClampedArray(40 * 20 * 4) };
for (let y = 0; y < 20; y++) for (let x = 0; x < 40; x++) { const k = (y * 40 + x) * 4; const rosso = x < 20; img.data.set(rosso ? [220, 20, 20, 255] : [20, 20, 220, 255], k); }
const camp = C.campiona(img, 10, 5, { modo: 'riempi', bw: 1, bh: 1 }); // proporzioni 2:1, come l'immagine
const gf = C.quantizza(camp, 10, 5, ['#dc1414', '#1414dc', '#ffffff'], {});
gf.forEach((r) => { assert.deepStrictEqual(r.slice(0, 5), [0, 0, 0, 0, 0]); assert.deepStrictEqual(r.slice(5), [1, 1, 1, 1, 1]); });
// ruota 90 gradi: la meta' sinistra (rossa) diventa la meta' alta
const cr = C.campiona(img, 5, 10, { modo: 'riempi', bw: 1, bh: 1, ruota: true });
const gr = C.quantizza(cr, 5, 10, ['#dc1414', '#1414dc'], {});
assert.ok(gr.slice(0, 5).every((r) => r.every((v) => v === 0)) && gr.slice(5).every((r) => r.every((v) => v === 1)));
// adatta: l'immagine 2:1 su griglia quadrata lascia bande vuote (sfondo = indice 2)
const ca = C.campiona(img, 10, 10, { modo: 'adatta', bw: 1, bh: 1 });
const ga = C.quantizza(ca, 10, 10, ['#dc1414', '#1414dc', '#ffffff'], { sfondo: 2 });
assert.deepStrictEqual(ga[0], Array(10).fill(2)); assert.ok(ga[5].includes(0) && ga[5].includes(1));
// palette automatica: 2 colori dalla foto, abbinati a codici Delica distinti
const pf = C.paletteDaFoto(camp, 10, 5, 2, 1);
assert.strictEqual(pf.length, 2); assert.notStrictEqual(pf[0].cod, pf[1].cod); assert.ok(/^DB \d{3}/.test(pf[0].cod));
// foto su larghezza fissa: 100 mm, foto 2:1 (200x100)
const of = C.opzioniFoto(100, 200, 100, C.PERLINE, 30);
const o11 = of.find((x) => x.id === '11'), o15 = of.find((x) => x.id === '15');
assert.strictEqual(o11.cols, 63); assert.strictEqual(o11.rows, 38); assert.strictEqual(o11.tot, 63 * 38);
assert.strictEqual(o15.cols, 77);
assert.strictEqual(of.filter((x) => x.consigliata).length, 1);
assert.strictEqual(of.find((x) => x.consigliata).id, '8'); // 100/3 = 33 colonne >= 30: la piu' grande che basta
assert.strictEqual(C.opzioniFoto(20, 100, 100, C.PERLINE, 60).find((x) => x.consigliata).id, '15'); // nessuna arriva a 60: la piu' piccola
// schema gia' a quadretti: griglia 8 x 12 con linee, cella 11 px, margine 15 px, tre colori
{
  const cell = 11, mar = 15, cols = 8, rows = 12, W = cols * cell + 1 + 2 * mar, H = rows * cell + 1 + 2 * mar;
  const d = new Uint8ClampedArray(W * H * 4).fill(255);
  const col = (r, c) => ((r + c) % 3 === 0 ? [20, 20, 20] : (r % 2 ? [150, 200, 230] : [235, 200, 170]));
  const put = (x, y, v) => { const k = (y * W + x) * 4; d[k] = v[0]; d[k + 1] = v[1]; d[k + 2] = v[2]; };
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) for (let y = 0; y < cell; y++) for (let x = 0; x < cell; x++) put(mar + c * cell + x, mar + r * cell + y, col(r, c));
  for (let c = 0; c <= cols; c++) for (let y = 0; y <= rows * cell; y++) put(mar + c * cell, mar + y, [120, 100, 90]);
  for (let r = 0; r <= rows; r++) for (let x = 0; x <= cols * cell; x++) put(mar + x, mar + r * cell, [120, 100, 90]);
  const im = { w: W, h: H, data: d }, g = C.rilevaGriglia(im);
  assert.ok(g, 'griglia non rilevata'); assert.strictEqual(g.cols, cols); assert.strictEqual(g.rows, rows);
  const cp = C.leggiQuadretti(im, g), pal = ['#141414', '#96c8e6', '#ebc8aa'];
  const q = C.quantizza(cp, cols, rows, pal, {});
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const v = col(r, c), atteso = v[0] === 20 ? 0 : (v[0] === 150 ? 1 : 2);
    assert.strictEqual(q[r][c], atteso, `cella ${r},${c}`);
  }
  assert.strictEqual(C.paletteDaFoto(cp, cols, rows, 0, 1).length, 3); // numero colori automatico
  // una foto "morbida" (sfumatura) non e' una griglia
  const f = new Uint8ClampedArray(200 * 100 * 4); for (let y = 0; y < 100; y++) for (let x = 0; x < 200; x++) { const k = (y * 200 + x) * 4; f[k] = x; f[k + 1] = y * 2; f[k + 2] = 128; f[k + 3] = 255; }
  assert.strictEqual(C.rilevaGriglia({ w: 200, h: 100, data: f }), null);
}
console.log('core ok');
