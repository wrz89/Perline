# Guida a Perline

## Come si avvia
- **Perline.exe** (consigliato): scaricalo dalla sezione Releases del repository, mettilo in una cartella e fai doppio clic. Si apre una finestra nera (lasciala aperta) e l'app nel browser. I progetti vanno nella cartella `dati` accanto all'exe.
- **index.html**: puoi anche aprire direttamente il file `web/index.html` nel browser. Funziona senza server: i progetti si salvano nella memoria del browser. Per sicurezza usa **Esporta** per avere un file di backup e **Importa** per riaprirlo (anche su un altro PC).
- **Python**: `avvia_perline.bat` (serve Python 3). Aggiornamento con `aggiorna_perline.bat`.

## Il primo progetto in 2 minuti
- In **Griglia** scegli la tecnica (Telaio o Peyote), la larghezza in perline e la lunghezza in righe, poi **Applica misure**.
- In **Colori** clicca un colore per sceglierlo e disegna sulla griglia: trascina per dipingere. **Riempi** colora un'area intera, **Simmetria** specchia ogni gesto, **Annulla/Ripeti** (anche Ctrl+Z / Ctrl+Y).
- In alto dai un nome e premi **Salva**. In **Materiali** vedi subito quante perline servono per colore.

## Colori
- Ogni colore ha una **lettera** (A, B, C…), usata nelle celle, nella legenda e nella lettura per riga.
- Per ogni colore puoi cambiare tinta, **codice Delica (DB)** e nome. Premi **×** per rimuovere un colore non usato.
- **+ colore** ne aggiunge uno casuale; **+ dalla libreria colori…** aggiunge uno di 30 colori comuni (bianco, nero, grigi, rosa, blu, verdi…). Le tinte sono indicative: **il codice DB va scritto da te** guardando la bustina o il catalogo, perché non esiste una tabella ufficiale integrata.
- Attenzione: i colori preimpostati (DB 201, DB 051, DB 1812) sono solo segnaposto in tonalità di grigio. Negli schemi stampati in bianco e nero non si vede il colore vero, e il codice DB indica il colore reale (ad esempio DB 1812 è un aqua chiaro satinato, non un grigio). Imposta la tinta giusta con il selettore.

## Generatore motivi (rombi, chevron, righe)
- Scegli **Motivo**, le **righe per modulo** (il disegno si ripete ogni N righe) e i 4 anelli, dal centro allo sfondo. Premi **Genera su tutta la griglia**.
- **Ripeti le prime righe del modulo** prende le prime N righe che hai disegnato a mano e le ripete fino alla fine: comodo per fare un modulo piccolo e allungarlo.

## Generatore casuale
- Spunta i **colori** da usare, scegli la **simmetria** (specchio sinistra/destra, o doppio), la **dimensione dei blocchi** (1 = perlina singola, 2–4 = blocchi più grandi) e, se vuoi, **Ripeti ogni N righe** per un motivo che si ripete.
- **Nuovo casuale** estrae un nuovo disegno e un nuovo **seme**. Lo stesso seme dà sempre lo stesso disegno: annota il seme dei motivi che ti piacciono e usa **Rigenera col seme** per ritrovarli.
- Se un risultato non ti convince, premi **Annulla** o riprova: la griglia si può poi ritoccare a mano.

## Materiali e stime
- La tabella mostra le perline per colore e gli **rp.** (1 rp. = 200 perline, ricavato dai tuoi schemi: 220 perline = 1,1 rp.).
- Telaio: ordito = larghezza + 1 fili, lunghi quanto il lavoro + 40 cm di sprechi; trama = ogni riga attraversa due volte la larghezza. Peyote: lunghezza × 4 + 30 cm. Sono **stime** con una perlina Delica da 1,6 × 1,3 mm: tieni un po' di margine.

## Stampa / PDF
- **Stampa / PDF** apre la finestra di stampa del browser: scegli *Salva come PDF* oppure la stampante.
- Pagina 1: schema con numeri ogni 5 righe, lettere nelle celle e legenda. Pagina 2: **lettura riga per riga**, da sinistra a destra, partendo dall'alto (`A3 B A2` = 3 perline A, 1 B, 2 A).

## Salvataggio e backup
- Con l'exe o Python: i progetti sono file nella cartella `dati`, che gli aggiornamenti non toccano.
- Aprendo index.html: i progetti stanno nel browser. Se cancelli i dati del sito li perdi, quindi usa **Esporta** per un backup.
- I file esportati (`.perline.json`) si riaprono con **Importa** su qualsiasi PC.

## Problemi comuni
- **Windows blocca l'exe** ("Il PC è stato protetto"): Ulteriori informazioni → Esegui comunque.
- **La pagina non si apre**: lascia aperta la finestra nera e vai su http://127.0.0.1:8765 nel browser.
- **Ho perso i progetti**: se avevi usato index.html su un altro browser o computer non li trovi; esporta sempre un backup.
- Altro? Scrivimi cosa vedi e cosa ti aspettavi.

