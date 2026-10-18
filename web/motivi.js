// Libreria di motivi. Ogni motivo e' una griglia di caratteri: '.' = sfondo, '1' '2' '3' = colori 1, 2, 3.
// tipo 'singolo': motivo da ripetere (centrato) con uno spazio tra una ripetizione e l'altra;
// tipo 'periodico': tassello che si ripete su tutta la griglia.
(function (root) {
  const costruisci = (w, h, f) => Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => f(x, y) || '.').join(''));
  // forme radiali centrate su una griglia N x N: f(dx, dy, r, ang) -> carattere
  const radiale = (N, f, H) => costruisci(N, H || N, (x, y) => {
    const dx = x - (N - 1) / 2, dy = y - ((H || N) - 1) / 2;
    return f(dx, dy, Math.hypot(dx, dy), Math.atan2(dy, dx));
  });
  // n petali ellittici disposti a raggiera (angolo 0 incluso: simmetrico), centro rotondo
  const petali = (N, n, dist, semiR, semiT, centro, off) => radiale(N, (dx, dy, r) => {
    if (r <= centro) return '2';
    for (let i = 0; i < n; i++) {
      const ph = (2 * Math.PI * i) / n + (off || 0), ux = Math.cos(ph), uy = Math.sin(ph);
      const rad = dx * ux + dy * uy - dist, tan = -dx * uy + dy * ux;
      if ((rad * rad) / (semiR * semiR) + (tan * tan) / (semiT * semiT) <= 1) return '1';
    }
    return '.';
  });
  // contorno: i bordi restano '1', l'interno diventa '2'
  const contorno = (righe) => righe.map((r, y) => r.split('').map((c, x) => {
    if (c !== '1') return c;
    const v = (xx, yy) => (righe[yy] && righe[yy][xx] === '1');
    return v(x - 1, y) && v(x + 1, y) && v(x, y - 1) && v(x, y + 1) ? '2' : '1';
  }).join(''));
  const CUORE = ['.111...111.', '11111.11111', '11111111111', '11111111111', '.111111111.', '..1111111..', '...11111...', '....111....', '.....1.....'];
  const a = Math.abs;

  const M = [
    // ---- fiori ----
    { id: 'fiore4', nome: 'Fiore 4 petali', tipo: 'singolo', gap: 3, righe: petali(11, 4, 3.4, 2.9, 2.1, 1.3, 0) },
    { id: 'fiore4d', nome: 'Fiore 4 petali (diag.)', tipo: 'singolo', gap: 3, righe: petali(11, 4, 3.3, 2.8, 2.4, 1.3, Math.PI / 4) },
    { id: 'fiore6', nome: 'Fiore 6 petali', tipo: 'singolo', gap: 3, righe: petali(13, 6, 4.1, 2.6, 1.7, 1.6, 0) },
    { id: 'margherita', nome: 'Margherita', tipo: 'singolo', gap: 3, righe: petali(13, 8, 4.2, 2.6, 1.2, 1.8, 0) },
    { id: 'quadrifoglio', nome: 'Quadrifoglio', tipo: 'singolo', gap: 3, righe: radiale(11, (dx, dy, r) => {
      const l = Math.hypot(a(dx) - 2.8, a(dy) - 2.8);
      return l <= 2.3 ? '1' : (r <= 1 ? '2' : '.');
    }) },
    { id: 'tulipano', nome: 'Tulipano', tipo: 'singolo', gap: 2, righe: [
      '.1..1..1.', '.11.1.11.', '.1111111.', '.1111111.', '..11111..', '...111...', '....3....', '..3.3.3..', '...333...', '....3....', '....3....'] },
    { id: 'fiorellino', nome: 'Fiorellino', tipo: 'singolo', gap: 2, righe: [
      '..1..', '.121.', '12221', '.121.', '..1..', '..3..', '.333.', '..3..'] },
    { id: 'rametto', nome: 'Rametto di foglie', tipo: 'singolo', gap: 2, righe: [
      '....3....', '..3.3.3..', '.33.3.33.', '..3.3.3..', '.33.3.33.', '..3.3.3..', '....3....', '....3....'] },
    // ---- cuori e stelle ----
    { id: 'cuore', nome: 'Cuore', tipo: 'singolo', gap: 3, righe: CUORE },
    { id: 'cuoricino', nome: 'Cuoricino piccolo', tipo: 'singolo', gap: 2, righe: ['.11.11.', '1111111', '1111111', '.11111.', '..111..', '...1...'] },
    { id: 'cuore2', nome: 'Cuore con bordo', tipo: 'singolo', gap: 3, righe: contorno(CUORE) },
    { id: 'stella5', nome: 'Stella 5 punte', tipo: 'singolo', gap: 3, righe: [
      '.....1.....', '.....1.....', '....111....', '....111....', '11111111111', '.111111111.', '..1111111..', '..1111111..', '.111...111.', '.11.....11.', '11.......11'] },
    { id: 'stella8', nome: 'Stella nordica', tipo: 'singolo', gap: 3, righe: radiale(11, (dx, dy, r) => {
      const ax = a(dx), ay = a(dy);
      if (r <= 1.1) return '2';
      if (Math.min(ax, ay) <= 0.5 && Math.max(ax, ay) <= 5) return '1';
      if (a(ax - ay) <= 0.5 && Math.max(ax, ay) <= 4) return '1';
      if (Math.min(ax, ay) <= 1.5 && Math.max(ax, ay) <= 3) return '3';
      return '.';
    }) },
    { id: 'fiocco', nome: 'Fiocco di neve', tipo: 'singolo', gap: 3, righe: radiale(11, (dx, dy, r) => {
      const ax = a(dx), ay = a(dy);
      if (r <= 0.6) return '3';
      const asse = Math.min(ax, ay) === 0 && Math.max(ax, ay) <= 5, diag = ax === ay && ax <= 4;
      if (asse || diag) return '1';
      const ram = (Math.max(ax, ay) === 3 && Math.min(ax, ay) === 1) || (ax === 3 && ay === 3) ? '2' : '.';
      return ram;
    }) },
    // ---- figure ----
    { id: 'farfalla', nome: 'Farfalla', tipo: 'singolo', gap: 3, righe: [
      '11.......11', '111..3..111', '.1112.2111.', '..1113111..', '.1112.2111.', '111..3..111', '11.......11'] },
    { id: 'albero', nome: 'Albero', tipo: 'singolo', gap: 2, righe: [
      '.....2.....', '....111....', '...11111...', '....111....', '...11211...', '..1111111..', '.111121111.', '..1111111..', '....333....', '....333....'] },
    { id: 'casetta', nome: 'Casetta', tipo: 'singolo', gap: 3, righe: [
      '....1....', '...111...', '..11111..', '.1111111.', '111111111', '.2222222.', '.2233322.', '.2233322.', '.2233322.'] },
    { id: 'croce', nome: 'Croce', tipo: 'singolo', gap: 3, righe: radiale(9, (dx, dy) => (Math.min(a(dx), a(dy)) <= 1 && Math.max(a(dx), a(dy)) <= 4 ? '1' : '.')) },
    { id: 'occhio', nome: 'Occhio', tipo: 'singolo', gap: 3, righe: costruisci(11, 7, (x, y) => {
      const dx = (x - 5) / 5.4, dy = (y - 3) / 3.3, v = dx * dx + dy * dy;
      return v > 1 ? '.' : (v < 0.1 ? '3' : (v < 0.42 ? '2' : '1'));
    }) },
    { id: 'rombo', nome: 'Rombo concentrico', tipo: 'singolo', gap: 2, righe: radiale(11, (dx, dy) => { const d = a(dx) + a(dy); return d > 5 ? '.' : (d % 2 === 0 ? '1' : '2'); }) },
    { id: 'cerchio', nome: 'Cerchi concentrici', tipo: 'singolo', gap: 2, righe: radiale(11, (dx, dy, r) => (r > 5.3 ? '.' : (r < 1.2 ? '3' : (r < 3.2 ? '2' : '1')))) },
    // ---- ripetuti su tutta la larghezza ----
    { id: 'zigzag', nome: 'Zig-zag', tipo: 'periodico', righe: ['1......1', '.1....1.', '..1..1..', '...11...'] },
    { id: 'zigzag2', nome: 'Zig-zag doppio', tipo: 'periodico', righe: ['1......1', '.1....1.', '..1..1..', '...11...', '2......2', '.2....2.', '..2..2..', '...22...'] },
    { id: 'onde', nome: 'Onde', tipo: 'periodico', righe: costruisci(8, 5, (x, y) => (y === Math.round(2 + 2 * Math.cos((2 * Math.PI * (x - 3.5)) / 8)) ? '1' : '.')) },
    { id: 'scacchi', nome: 'Scacchiera', tipo: 'periodico', righe: ['11..', '11..', '..11', '..11'] },
    { id: 'diagonali', nome: 'Righe diagonali', tipo: 'periodico', righe: ['1...', '.1..', '..1.', '...1'] },
    { id: 'triangoli', nome: 'Triangoli', tipo: 'periodico', righe: ['..11..', '.1111.', '111111'] },
    { id: 'losanghe', nome: 'Losanghe', tipo: 'periodico', righe: ['..11..', '.1..1.', '1....1', '1....1', '.1..1.', '..11..'] },
    { id: 'puntini', nome: 'Puntini', tipo: 'periodico', righe: ['....', '.1..', '....', '..1.'] },
    { id: 'dentisega', nome: 'Dente di sega', tipo: 'periodico', righe: ['1.....', '11....', '111...', '1111..', '11111.', '111111'] },
    { id: 'quadrati', nome: 'Quadrati concentrici', tipo: 'periodico', righe: radiale(7, (dx, dy) => (Math.max(a(dx), a(dy)) % 2 === 0 ? '1' : '2')) },
    { id: 'gradini', nome: 'Greca a gradini', tipo: 'periodico', righe: ['111.....', '1.1.....', '1.111...', '..1.1...', '..1.111.', '....1.1.', '....1.11', '......1.'].slice(0, 8) },
  ];
  root.MOTIVI = M;
})(typeof window !== 'undefined' ? window : globalThis);
