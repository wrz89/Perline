# Guida a Perline

## Come si avvia
- **Perline.exe** (consigliato): scaricalo dalla sezione Releases del repository, mettilo in una cartella e fai doppio clic. Si apre una finestra nera (lasciala aperta) e l'app nel browser. I progetti vanno nella cartella `dati` accanto all'exe.
- **index.html**: puoi anche aprire direttamente il file `web/index.html` nel browser. Funziona senza server: i progetti si salvano nella memoria del browser. Per sicurezza usa **Esporta** per avere un file di backup e **Importa** per riaprirlo (anche su un altro PC).
- **Python**: `avvia_perline.bat` (serve Python 3). Aggiornamento con `aggiorna_perline.bat`.

## Modelli pronti
- In **Griglia → Modello** trovi i tre braccialetti **7 × 100**, **10 × 100** e **16 × 100**: rombi alternati scuro / medio su fondo chiaro, con i colori DB 201, DB 051 e DB 1812. Premi **Applica modello** (sostituisce palette e griglia).
- I modelli sono tarati sugli schemi di riferimento: il 7 × 100 dà esattamente 220 / 200 / 280 perline (1,1 / 1,0 / 1,4 rp.); gli altri due si discostano di pochissimo (10 × 100: 310 / 294 / 396; 16 × 100: 488 / 484 / 628).
- Cambia i colori del modello dal catalogo: la disposizione resta, cambia solo la tinta.

## Il primo progetto in 2 minuti
- In **Griglia** scegli la tecnica (Telaio o Peyote), la larghezza in perline e la lunghezza in righe, poi **Applica misure**.
- In **Colori** clicca un colore per sceglierlo e disegna sulla griglia: trascina per dipingere. **Riempi** colora un'area intera, **Simmetria** specchia ogni gesto, **Annulla/Ripeti** (anche Ctrl+Z / Ctrl+Y).
- In alto dai un nome e premi **Salva**. In **Materiali** vedi subito quante perline servono per colore.

## Colori
- Ogni colore ha una **lettera** (A, B, C…), usata nelle celle, nella legenda e nella lettura per riga.
- **Catalogo Miyuki Delica 11/0 integrato (1.288 colori).** Nel campo *Cerca Delica* scrivi un codice (`1812`, `db 201`) o parole del nome (`crystal ab`, `opaque white`) e clicca il risultato: il colore si aggiunge con codice, nome e tinta.
- In alternativa scrivi il **codice DB** nella riga di un colore e premi Invio: nome e tinta si compilano da soli. I codici nel formato degli schemi (`DB 051`, `DB 1812`) funzionano, anche senza zeri o senza «DB».
- Le **tinte sono approssimate** (media delle foto ufficiali Miyuki): controlla sempre la bustina, specialmente per lucidi, metallici e rivestiti. I colori fuori produzione sono segnalati.
- **+ colore libero** aggiunge un colore tuo, con tinta e nome a piacere. **×** rimuove un colore non usato.
- I colori di partenza sono quelli degli schemi di riferimento: **DB 201** (Opaque White Luster), **DB 051** (Transparent Crystal AB), **DB 1812** (Color-Lined Silk Green Luster). Negli schemi stampati in bianco e nero i colori vengono resi in grigio, ma i codici sono quelli.

## Generatore motivi (rombi, chevron, righe)
- Scegli **Motivo**, le **righe per modulo** (il disegno si ripete ogni N righe) e i 4 anelli, dal centro allo sfondo. Premi **Genera su tutta la griglia**.
- **Ripeti le prime righe del modulo** prende le prime N righe che hai disegnato a mano e le ripete fino alla fine: comodo per fare un modulo piccolo e allungarlo.
- **Rombi alternati (come schemi)**: rombi di due colori sfalsati di mezzo passo con bordo di sfondo. Imposta larghezza e altezza del rombo (in perline e righe) e lo spessore del bordo; Anello 1 = rombo A, Anello 2 = rombo B, Anello 4 = sfondo. Per rombi regolari usa altezza ≈ 1,2 × larghezza.

## Da foto
- Nel riquadro **Da foto** carica un'immagine (JPG, PNG…): viene portata sulla griglia attuale, larghezza × righe, rispettando le proporzioni della perlina (1,6 × 1,3 mm), quindi non risulta stirata.
- **Inquadratura**: *Riempi* ritaglia al centro e riempie tutta la griglia; *Adatta* mostra tutta la foto e lascia bande vuote del colore più chiaro.
- **Adatta lunghezza alla foto** imposta le righe in base alla larghezza scelta, così l'intera foto entra senza ritagli.
- **Ruota di 90°** è utile per i braccialetti stretti e lunghi: una foto in verticale va ruotata per seguire la lunghezza.
- **Colori**: *Quelli della palette* usa solo i colori che hai già (comodo se hai le perline); *Ricavali dalla foto* sceglie da 2 a 12 colori dominanti e li abbina ai Delica più vicini, sostituendo la palette.
- **Sfumatura** simula i toni intermedi a punti (bene per foto, meno per loghi); **Contrasto** schiarisce o scurisce. Con poche perline le foto con soggetti semplici e contrasti netti vengono meglio.
- Dopo la conversione puoi ritoccare a mano, annullare (Ctrl+Z) e stampare come ogni altro schema.

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

## Crediti
- Codici e tinte Miyuki Delica: [makebead/craft-color-codes](https://github.com/makebead/craft-color-codes), licenza CC BY 4.0, basato sul catalogo e sulle foto ufficiali Miyuki. Perline Delica e Miyuki sono marchi dei rispettivi proprietari; Perline non è affiliato a Miyuki.

