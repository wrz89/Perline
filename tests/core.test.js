const assert = require('assert');
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
assert.ok(C.LIBRERIA.length >= 25);
console.log('core ok');
