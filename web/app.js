(function () {
  const C = window.Core;
  const $ = (id) => document.getElementById(id);
  const cv = $('cv'), ctx = cv.getContext('2d');
  const OPZ = { larghezzaMm: 1.6, altezzaMm: 1.3, fattoreFilo: 4, margineCm: 30, perRp: 200, spreccoOrditoCm: 40, extraTramaMm: 10 };

  let S = nuovoProgetto();
  let colore = 0, strumento = 'penna', zoom = 22, disegnando = false;
  let undoSt = [], redoSt = [];

  function nuovoProgetto() {
    const m = C.applicaModello(C.MODELLI[1]);
    return { nome: '', tecnica: 'telaio', w: m.w, h: m.h, palette: m.palette, celle: m.celle, opz: { ...OPZ } };
  }

  function msg(t) { $('msg').textContent = t; clearTimeout(msg.t); msg.t = setTimeout(() => ($('msg').textContent = ''), 3500); }

  // ---- disegno ----
  function geom(z) {
    const cw = z, ch = Math.max(6, Math.round((z * S.opz.altezzaMm) / S.opz.larghezzaMm)), margL = 44, margT = 26;
    return { cw, ch, margL, margT };
  }
  function disegna(c2d, z, opt) {
    const { cw, ch, margL, margT } = geom(z);
    const sfal = S.tecnica === 'peyote' ? ch / 2 : 0;
    const W = margL + S.w * cw + 10, H = margT + S.h * ch + sfal + 6;
    c2d.canvas.width = W; c2d.canvas.height = H;
    c2d.fillStyle = '#fff'; c2d.fillRect(0, 0, W, H);
    c2d.font = Math.max(9, Math.round(z * 0.5)) + 'px sans-serif';
    c2d.textAlign = 'center'; c2d.textBaseline = 'middle';
    for (let r = 0; r < S.h; r++) for (let c = 0; c < S.w; c++) {
      const x = margL + c * cw, y = margT + r * ch + (c % 2 ? sfal : 0);
      const col = S.palette[S.celle[r][c]] || { hex: '#f0f' };
      c2d.fillStyle = col.hex; c2d.fillRect(x, y, cw, ch);
      c2d.strokeStyle = 'rgba(0,0,0,.35)'; c2d.lineWidth = 1; c2d.strokeRect(x + .5, y + .5, cw - 1, ch - 1);
      if (opt.lettere) {
        const lum = parseInt(col.hex.slice(1, 3), 16) * .3 + parseInt(col.hex.slice(3, 5), 16) * .59 + parseInt(col.hex.slice(5, 7), 16) * .11;
        c2d.fillStyle = lum > 140 ? '#222' : '#fff';
        c2d.fillText(C.lettera(S.celle[r][c]), x + cw / 2, y + ch / 2 + 1);
      }
    }
    c2d.fillStyle = '#222'; c2d.textAlign = 'right';
    for (let r = 0; r < S.h; r++) if ((r + 1) % 5 === 0 || r === 0) {
      c2d.fillText(String(r + 1), margL - 6, margT + r * ch + ch / 2);
      c2d.strokeStyle = '#999'; c2d.beginPath(); c2d.moveTo(margL - 4, margT + r * ch + ch / 2 + .5); c2d.lineTo(margL, margT + r * ch + ch / 2 + .5); c2d.stroke();
    }
    c2d.textAlign = 'center';
    for (let c = 0; c < S.w; c++) c2d.fillText(String(c + 1), margL + c * cw + cw / 2, 12);
    c2d.textAlign = 'left'; c2d.fillText('START ↓', 2, 12);
  }
  function ridisegna() { disegna(ctx, zoom, { lettere: $('lettere').checked }); materiali(); }

  function cella(ev) {
    const rect = cv.getBoundingClientRect();
    const { cw, ch, margL, margT } = geom(zoom);
    const x = (ev.clientX - rect.left) * (cv.width / rect.width), y = (ev.clientY - rect.top) * (cv.height / rect.height);
    const c = Math.floor((x - margL) / cw);
    if (c < 0 || c >= S.w) return null;
    const sf = S.tecnica === 'peyote' && c % 2 ? ch / 2 : 0;
    const r = Math.floor((y - margT - sf) / ch);
    return r < 0 || r >= S.h ? null : { r, c };
  }

  // ---- storia ----
  function snapshot() { undoSt.push(JSON.stringify(S.celle)); if (undoSt.length > 100) undoSt.shift(); redoSt = []; }
  function annulla() { if (!undoSt.length) return; redoSt.push(JSON.stringify(S.celle)); S.celle = JSON.parse(undoSt.pop()); ridisegna(); }
  function ripeti() { if (!redoSt.length) return; undoSt.push(JSON.stringify(S.celle)); S.celle = JSON.parse(redoSt.pop()); ridisegna(); }

  function applica(p) {
    const val = (r, c) => { S.celle[r][c] = colore; };
    if (strumento === 'riempi') { C.riempi(S.celle, p.r, p.c, colore); if ($('simm').checked) C.riempi(S.celle, p.r, S.w - 1 - p.c, colore); }
    else { val(p.r, p.c); if ($('simm').checked) val(p.r, S.w - 1 - p.c); }
  }
  cv.addEventListener('mousedown', (e) => {
    const p = cella(e); if (!p) return;
    snapshot(); disegnando = strumento === 'penna'; applica(p); ridisegna();
  });
  cv.addEventListener('mousemove', (e) => { if (!disegnando) return; const p = cella(e); if (p) { applica(p); ridisegna(); } });
  window.addEventListener('mouseup', () => { disegnando = false; });
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); annulla(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); ripeti(); }
  });

  // ---- palette ----
  function opzioniColore() {
    ['g-c0', 'g-c1', 'g-c2', 'g-c3'].forEach((id, i) => {
      const sel = $(id), v = sel.value;
      sel.innerHTML = S.palette.map((c, k) => `<option value="${k}">${C.lettera(k)} - ${c.cod || c.nome}</option>`).join('');
      sel.value = v !== '' && +v < S.palette.length ? v : String(Math.min(i === 0 ? 2 : i === 1 ? 1 : 0, S.palette.length - 1));
    });
  }
  function disegnaPalette() {
    const usati = C.conteggi(S.celle, S.palette.length);
    $('pal').innerHTML = '';
    S.palette.forEach((c, i) => {
      const d = document.createElement('div'); d.className = 'pal' + (i === colore ? ' sel' : '');
      d.innerHTML = `<b>${C.lettera(i)}</b><input type="color" value="${c.hex}"><input type="text" value="${c.cod}" placeholder="DB 000"><input type="text" value="${c.nome}" placeholder="nome"><button title="Rimuovi" ${usati[i] || S.palette.length < 2 ? 'disabled' : ''}>×</button>`;
      const [ , hx, cod, nome, rm] = d.children;
      d.addEventListener('click', () => { colore = i; disegnaPalette(); });
      hx.addEventListener('input', () => { c.hex = hx.value; ridisegna(); });
      cod.addEventListener('input', () => { c.cod = cod.value; materiali(); });
      cod.addEventListener('change', () => {
        const x = C.colore(cod.value);
        if (x) { c.cod = x.cod; c.nome = x.nome; c.hex = x.hex; disegnaPalette(); ridisegna(); msg(x.cod + ' ' + x.nome); }
        else if (cod.value.trim()) msg('Codice non nel catalogo Delica: tinta e nome restano manuali');
      });
      nome.addEventListener('input', () => { c.nome = nome.value; materiali(); });
      rm.addEventListener('click', (e) => { e.stopPropagation(); rimuoviColore(i); });
      $('pal').appendChild(d);
    });
    opzioniColore(); if (window.__rc) listaCasuale();
  }
  function rimuoviColore(i) {
    S.palette.splice(i, 1);
    S.celle = S.celle.map((r) => r.map((v) => (v > i ? v - 1 : v)));
    colore = Math.min(colore, S.palette.length - 1); disegnaPalette(); ridisegna();
  }
  $('addcol').onclick = () => {
    if (S.palette.length >= 26) return;
    S.palette.push({ cod: '', nome: 'Colore ' + (S.palette.length + 1), hex: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0') });
    colore = S.palette.length - 1; disegnaPalette();
  };

  // ---- materiali ----
  const num = (n, d) => n.toFixed(d).replace('.', ',');
  function materiali() {
    const cnt = C.conteggi(S.celle, S.palette.length), tot = cnt.reduce((a, b) => a + b, 0);
    const m = C.stimaMisure(S.w, S.h, S.opz, S.tecnica);
    $('mat').innerHTML = `<table><tr><th></th><th>Colore</th><th>Perline</th><th>rp.</th></tr>` +
      S.palette.map((c, i) => `<tr><td><span class="sw" style="background:${c.hex}"></span> ${C.lettera(i)}</td><td>${esc(c.cod)} ${esc(c.nome)}</td><td>${cnt[i]}</td><td>${num(C.rp(cnt[i], S.opz.perRp), 1)}</td></tr>`).join('') +
      `<tr><th></th><th>Totale</th><th>${tot}</th><th></th></tr></table>` +
      `<small>${testoMisure(m)}</small>`;
  }
  function testoMisure(m) {
    const mis = `Misure circa ${num(m.largMm / 10, 1)} × ${num(m.lungMm / 10, 1)} cm`;
    const filo = S.tecnica === 'telaio'
      ? `${m.fiiOrdito} fili di ordito da ≈ ${m.ordCm} cm · filo di trama ≈ ${num(m.tramaCm / 100, 1)} m`
      : `filo ≈ ${m.filoCm} cm`;
    return `${mis} · ${filo} (stime). 1 rp. = ${S.opz.perRp} perline.`;
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---- controlli ----
  function sync() {
    $('nome').value = S.nome; $('tecnica').value = S.tecnica; $('w').value = S.w; $('h').value = S.h; $('bw').value = S.opz.larghezzaMm; $('bh').value = S.opz.altezzaMm; fotoOpzioni();
    disegnaPalette(); ridisegna();
  }
  ['bw', 'bh'].forEach((id) => $(id).addEventListener('change', () => {
    const bw = +$('bw').value, bh = +$('bh').value;
    if (bw > 0 && bh > 0) { S.opz.larghezzaMm = bw; S.opz.altezzaMm = bh; ridisegna(); fotoOpzioni(); }
  }));
  $('tecnica').onchange = () => { S.tecnica = $('tecnica').value; ridisegna(); };
  $('lettere').onchange = ridisegna;
  $('zoom').oninput = () => { zoom = +$('zoom').value; ridisegna(); };
  $('ridim').onclick = () => {
    const w = Math.max(1, Math.min(150, +$('w').value || 1)), h = Math.max(1, Math.min(1000, +$('h').value || 1));
    const bw = +$('bw').value, bh = +$('bh').value;
    if (bw > 0 && bh > 0) { S.opz.larghezzaMm = bw; S.opz.altezzaMm = bh; }
    const cnt = C.conteggi(S.celle, S.palette.length);
    snapshot(); S.celle = C.ridimensiona(S.celle, w, h, cnt.indexOf(Math.max(...cnt)));
    S.w = w; S.h = h; sync();
  };
  $('modello').innerHTML = '<option value="">Modello…</option>' + C.MODELLI.map((m) => `<option value="${m.id}">${m.nome}</option>`).join('');
  $('applica-modello').onclick = () => {
    const m = C.MODELLI.find((x) => x.id === $('modello').value); if (!m) return msg('Scegli un modello');
    if (!confirm('Il modello sostituisce palette e griglia attuali. Continuare?')) return;
    const x = C.applicaModello(m); snapshot(); S.tecnica = 'telaio'; S.palette = x.palette; S.celle = x.celle; S.w = x.w; S.h = x.h; colore = 0;
    $('g-dw').value = m.dw; $('g-dh').value = m.dh; sync(); msg(m.nome + ' applicato');
  };
  $('t-penna').onclick = () => { strumento = 'penna'; $('t-penna').className = 'on'; $('t-riempi').className = ''; };
  $('t-riempi').onclick = () => { strumento = 'riempi'; $('t-riempi').className = 'on'; $('t-penna').className = ''; };
  $('undo').onclick = annulla; $('redo').onclick = ripeti;
  $('genera').onclick = () => {
    const rings = ['g-c0', 'g-c1', 'g-c2', 'g-c3'].map((id) => +$(id).value);
    const bordo = { sottile: [0.95, 0.8], medio: [0.9, 0.75], largo: [0.8, 0.6] }[$('g-bordo').value];
    snapshot(); S.celle = C.genera($('g-tipo').value, S.w, S.h, Math.max(2, +$('g-p').value || 2), rings, { dw: +$('g-dw').value, dh: +$('g-dh').value, tA: bordo[0], tB: bordo[1] }); ridisegna(); disegnaPalette();
  };
  $('ripeti').onclick = () => {
    const p = Math.max(1, Math.min(S.h, +$('g-p').value || 1));
    snapshot(); S.celle = C.ripetiModulo(S.celle, p, S.h); ridisegna(); disegnaPalette();
  };

  // ---- progetti ----
  // Con il server locale i progetti vanno nella cartella "dati"; aprendo index.html direttamente
  // (file://) o se il server non risponde si usa la memoria del browser (localStorage).
  let usaServer = location.protocol.indexOf('http') === 0;
  const PFX = 'perline:';
  async function api(metodo, url, corpo) {
    const r = await fetch(url, { method: metodo, body: corpo ? JSON.stringify(corpo) : undefined, headers: corpo ? { 'Content-Type': 'application/json' } : undefined });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).errore || r.status);
    return r.json();
  }
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const archivio = {
    async lista() {
      if (usaServer) { try { return await api('GET', '/api/progetti'); } catch (e) { usaServer = false; } }
      try { return Object.keys(localStorage).filter((k) => k.indexOf(PFX) === 0).map((k) => k.slice(PFX.length)).sort(); } catch (e) { return []; }
    },
    async salva(n, dati) {
      if (usaServer) return api('PUT', '/api/progetti/' + encodeURIComponent(n), dati);
      try { localStorage.setItem(PFX + n, JSON.stringify(dati)); } catch (e) { throw new Error('memoria del browser non disponibile'); }
    },
    async apri(n) {
      if (usaServer) return api('GET', '/api/progetti/' + encodeURIComponent(n));
      const t = lsGet(PFX + n); if (!t) throw new Error('non trovato'); return JSON.parse(t);
    },
    async elimina(n) {
      if (usaServer) return api('DELETE', '/api/progetti/' + encodeURIComponent(n));
      try { localStorage.removeItem(PFX + n); } catch (e) {}
    },
  };
  async function elenco() {
    const nomi = await archivio.lista();
    $('elenco').innerHTML = '<option value="">Apri progetto…</option>' + nomi.map((n) => `<option>${esc(n)}</option>`).join('');
    $('dove').textContent = usaServer ? '' : 'Salvataggio nel browser (usa Esporta per un file di backup)';
  }
  function carica(dati) {
    if (!dati || !Array.isArray(dati.celle) || !Array.isArray(dati.palette) || !dati.celle.length) throw new Error('file non valido');
    S = dati; S.w = S.celle[0].length; S.h = S.celle.length; S.opz = { ...OPZ, ...(S.opz || {}) };
    undoSt = []; redoSt = []; colore = 0; sync();
  }
  $('salva').onclick = async () => {
    S.nome = $('nome').value.trim();
    if (!S.nome) return msg('Dai un nome al progetto');
    try { await archivio.salva(S.nome, S); msg('Salvato'); elenco(); } catch (e) { msg('Errore: ' + e.message); }
  };
  $('elenco').onchange = async () => {
    const n = $('elenco').value; if (!n) return;
    try { carica(await archivio.apri(n)); msg('Aperto: ' + n); } catch (e) { msg('Errore: ' + e.message); }
  };
  $('nuovo').onclick = () => { S = nuovoProgetto(); undoSt = []; redoSt = []; colore = 0; sync(); };
  $('elimina').onclick = async () => {
    const n = $('nome').value.trim(); if (!n || !confirm('Eliminare "' + n + '"?')) return;
    try { await archivio.elimina(n); msg('Eliminato'); elenco(); } catch (e) { msg('Errore: ' + e.message); }
  };
  $('esporta').onclick = () => {
    S.nome = $('nome').value.trim() || 'progetto';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' }));
    a.download = S.nome.replace(/[^\w .()-]+/g, '_') + '.perline.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  $('importa').onchange = async () => {
    const f = $('importa').files[0]; if (!f) return;
    try { const d = JSON.parse(await f.text()); carica(d); msg('Importato: ' + (d.nome || f.name)); } catch (e) { msg('Errore: ' + e.message); }
    $('importa').value = '';
  };
  $('esci').onclick = async () => {
    if (!usaServer) return msg('Puoi chiudere questa scheda del browser');
    if (confirm('Chiudere Perline?')) { try { await api('POST', '/api/esci'); } catch (e) {} document.body.innerHTML = '<p style="padding:20px">Perline chiuso. Puoi chiudere questa scheda.</p>'; }
  };

  // ---- catalogo Delica e generatore casuale ----
  function aggiungiColore(x) {
    const gia = S.palette.findIndex((p) => p.cod === x.cod);
    if (gia >= 0) { colore = gia; disegnaPalette(); return msg(x.cod + ' e\' gia\' nella palette'); }
    if (S.palette.length >= 26) return msg('Massimo 26 colori');
    S.palette.push({ cod: x.cod, nome: x.nome, hex: x.hex }); colore = S.palette.length - 1; disegnaPalette();
  }
  $('cerca').addEventListener('input', () => {
    const r = C.cerca($('cerca').value, 25);
    $('risultati').innerHTML = r.map((x, i) => `<div class="ris" data-i="${i}"><span class="sw" style="background:${x.hex}"></span> <b>${x.cod}</b> ${esc(x.nome)}${x.fuori ? ' <small>(fuori produzione)</small>' : ''}</div>`).join('') || ($('cerca').value ? '<small>Nessun risultato</small>' : '');
    $('risultati').querySelectorAll('.ris').forEach((el) => el.addEventListener('click', () => aggiungiColore(r[+el.dataset.i])));
  });
  function listaCasuale() {
    const sel = Array.from(document.querySelectorAll('#r-col input:checked')).map((x) => +x.value);
    const prima = new Set(sel);
    $('r-col').innerHTML = S.palette.map((c, i) => `<label style="justify-content:flex-start"><input type="checkbox" value="${i}" ${prima.size ? (prima.has(i) ? 'checked' : '') : (i < 3 ? 'checked' : '')}><span class="sw" style="background:${c.hex}"></span> ${C.lettera(i)} ${esc(c.cod || c.nome)}</label>`).join('');
  }
  function generaCasuale(nuovoSeme) {
    const colori = Array.from(document.querySelectorAll('#r-col input:checked')).map((x) => +x.value);
    if (!colori.length) return msg('Spunta almeno un colore');
    if (nuovoSeme) $('r-seme').value = Math.floor(Math.random() * 1e6);
    snapshot();
    S.celle = C.casuale(S.w, S.h, { colori, seme: +$('r-seme').value || 1, blocco: +$('r-blocco').value, simm: $('r-simm').value, modulo: +$('r-mod').value || 0 });
    ridisegna(); disegnaPalette();
  }
  $('r-gen').onclick = () => generaCasuale(true);
  $('r-ripeti').onclick = () => generaCasuale(false);

  // ---- foto -> schema ----
  let foto = null; // { w, h, data } RGBA ridotto a max 600 px
  $('foto-file').onchange = () => {
    const f = $('foto-file').files[0]; if (!f) return;
    const im = new Image(), url = URL.createObjectURL(f);
    im.onload = () => {
      const k = Math.min(1, 600 / Math.max(im.naturalWidth, im.naturalHeight));
      const cv2 = document.createElement('canvas'); cv2.width = Math.max(1, Math.round(im.naturalWidth * k)); cv2.height = Math.max(1, Math.round(im.naturalHeight * k));
      const x = cv2.getContext('2d'); x.drawImage(im, 0, 0, cv2.width, cv2.height);
      foto = { w: cv2.width, h: cv2.height, data: x.getImageData(0, 0, cv2.width, cv2.height).data };
      const an = $('foto-anteprima'), kk = Math.min(1, 220 / cv2.width); an.width = Math.round(cv2.width * kk); an.height = Math.round(cv2.height * kk);
      an.getContext('2d').drawImage(cv2, 0, 0, an.width, an.height); an.style.display = 'block';
      if (!(+$('foto-lm').value > 0)) $('foto-lm').value = Math.round(S.w * S.opz.larghezzaMm);
      fotoOpzioni();
      URL.revokeObjectURL(url); msg('Foto caricata: ' + cv2.width + ' × ' + cv2.height + ' px');
    };
    im.onerror = () => { URL.revokeObjectURL(url); msg('Impossibile leggere l\'immagine'); };
    im.src = url;
  };
  $('foto-colori').onchange = () => { $('foto-n-riga').style.display = $('foto-colori').value === 'foto' ? '' : 'none'; };
  $('foto-prop').onclick = () => {
    if (!foto) return msg('Carica prima una foto');
    const iw = $('foto-ruota').checked ? foto.h : foto.w, ih = $('foto-ruota').checked ? foto.w : foto.h;
    S.h = Math.max(1, Math.min(1000, Math.round((S.w * S.opz.larghezzaMm * ih) / (iw * S.opz.altezzaMm))));
    snapshot(); S.celle = C.ridimensiona(S.celle, S.w, S.h, 0); sync(); msg('Lunghezza adattata alla foto: ' + S.h + ' righe');
  };
  function convertiFoto() {
    if (!foto) return msg('Carica prima una foto');
    const camp = C.campiona(foto, S.w, S.h, { modo: $('foto-modo').value, ruota: $('foto-ruota').checked, bw: S.opz.larghezzaMm, bh: S.opz.altezzaMm });
    let palette = S.palette;
    if ($('foto-colori').value === 'foto') {
      if (!confirm('I colori verranno ricavati dalla foto e abbinati ai Delica: la palette attuale sara\' sostituita. Continuare?')) return;
      palette = C.paletteDaFoto(camp, S.w, S.h, Math.max(2, Math.min(12, +$('foto-n').value || 4)), 7);
      if (!palette.length) return msg('Nessun colore ricavato');
    }
    // sfondo (bande del modo "adatta"): il colore piu' chiaro
    let sf = 0, lmax = -1;
    palette.forEach((p, i) => { const L = C.lum(p.hex); if (L > lmax) { lmax = L; sf = i; } });
    snapshot();
    S.palette = palette.map((p) => ({ ...p }));
    S.celle = C.quantizza(camp, S.w, S.h, S.palette.map((p) => p.hex), { dither: $('foto-dither').checked, contrasto: +$('foto-contr').value / 100, sfondo: sf });
    colore = 0; sync(); msg('Foto convertita sul layout ' + S.w + ' × ' + S.h);
  }
  $('foto-conv').onclick = convertiFoto;
  // misure consigliate per far stare la foto su una larghezza: calcolo automatico (al caricamento e a ogni cambio)
  function fotoOpzioni() {
    const box = $('foto-opz');
    if (!foto) { box.innerHTML = ''; return; }
    const lm = +$('foto-lm').value;
    if (!(lm > 0)) { box.innerHTML = ''; return; }
    const rot = $('foto-ruota').checked, iw = rot ? foto.h : foto.w, ih = rot ? foto.w : foto.h;
    const misure = C.PERLINE.concat([{ id: 'mia', nome: 'La mia (' + S.opz.larghezzaMm + ' × ' + S.opz.altezzaMm + ' mm)', bw: S.opz.larghezzaMm, bh: S.opz.altezzaMm }]);
    const op = C.opzioniFoto(lm, iw, ih, misure, +$('foto-det').value);
    box.innerHTML = '<table><tr><th>Perlina</th><th>Griglia</th><th>Perline</th><th>Lungh.</th><th></th></tr>' +
      op.map((o) => `<tr${o.consigliata ? ' style="background:#e3efed"' : ''}><td>${o.consigliata ? '★ ' : ''}${esc(o.nome)}<br><small>${o.bw} × ${o.bh} mm</small></td><td>${o.cols} × ${o.rows}</td><td>${o.tot}</td><td>${num(o.lungCm, 1)} cm</td><td><button data-id="${o.id}">Usa</button></td></tr>`).join('') + '</table>' +
      '<small>★ = consigliata per il dettaglio scelto. "Usa" imposta perlina e griglia e converte la foto.</small>';
    box.querySelectorAll('button').forEach((bt) => bt.addEventListener('click', () => {
      const o = op.find((x) => x.id === bt.dataset.id);
      snapshot(); S.opz.larghezzaMm = o.bw; S.opz.altezzaMm = o.bh; S.w = Math.min(150, o.cols); S.h = Math.min(1000, o.rows);
      S.celle = C.ridimensiona(S.celle, S.w, S.h, 0); $('foto-modo').value = 'riempi'; sync(); convertiFoto();
    }));
  }
  ['foto-lm', 'foto-det', 'foto-ruota'].forEach((id) => $(id).addEventListener('input', fotoOpzioni));

  // ---- stampa ----
  $('stampa').onclick = () => {
    const off = document.createElement('canvas'), c2 = off.getContext('2d');
    disegna(c2, 26, { lettere: true });
    const cnt = C.conteggi(S.celle, S.palette.length), m = C.stimaMisure(S.w, S.h, S.opz, S.tecnica);
    const righe = S.celle.map((r, i) => `Riga ${i + 1}: ${C.lettura(r)}`).join('<br>');
    $('sheet').innerHTML = `<h1>${esc(S.nome || 'Progetto')} — ${S.tecnica === 'peyote' ? 'Peyote' : 'Telaio'} ${S.w} × ${S.h}</h1>
      <img src="${off.toDataURL('image/png')}"><table style="margin-top:8px"><tr><th>Lettera</th><th>Colore</th><th>Perline</th><th>rp.</th></tr>` +
      S.palette.map((c, i) => `<tr><td><span class="sw" style="background:${c.hex}"></span> ${C.lettera(i)}</td><td>${esc(c.cod)} ${esc(c.nome)}</td><td>${cnt[i]}</td><td>${num(C.rp(cnt[i], S.opz.perRp), 1)}</td></tr>`).join('') +
      `</table><p>${testoMisure(m)}</p><h1 style="page-break-before:always">Lettura per riga (sinistra → destra, dall'alto)</h1><div class="rig">${righe}</div>`;
    window.print();
  };

  window.__rc = true; listaCasuale();
  if (usaServer) fetch('/api/versione').then((r) => r.json()).then((v) => ($('ver').textContent = 'v' + v.versione)).catch(() => {});
  elenco().catch(() => {});
  sync();
})();
