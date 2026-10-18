# Perline

Progetta schemi per perline (Miyuki Delica) su **telaio** (default) o in **peyote**: griglia colorata,
generatore di rombi / chevron / righe, conteggio perline per colore (con "rp."),
misure e filo stimati, foglio di lavoro da stampare o salvare in PDF.

## Opzione 1 - Perline.exe (senza Python, consigliata per altri PC)
1. Scarica `Perline.exe` da  
   https://github.com/wrz89/Perline/releases/download/perline-latest/Perline.exe
2. Mettilo in una cartella tua (es. `C:\Perline`) e fai doppio clic.
   Se Windows mostra "Il PC è stato protetto": **Ulteriori informazioni -> Esegui comunque**
   (l'exe non è firmato).
3. Si apre una finestra nera (il motore, lasciala aperta) e l'app nel browser.
   I progetti si salvano nella cartella `dati` accanto all'exe.

**Aggiornare:** riscarica `Perline.exe` dallo stesso link e sostituisci il vecchio file
(la cartella `dati` resta intatta). Il link è sempre l'ultima versione.

## Opzione 2 - con Python (aggiornamento automatico)
1. Serve Python 3 (python.org, spunta "Add python.exe to PATH").
2. Crea una cartella, ad es. `C:\Perline`, e salvaci dentro `aggiorna_perline.bat` (dal repository).
3. Doppio clic su `aggiorna_perline.bat`: scarica tutto (rilancialo per aggiornare).
4. Doppio clic su `avvia_perline.bat`: si apre l'app nel browser.

L'exe viene compilato dalla GitHub Action `Perline exe` a ogni modifica e pubblicato nella
release `perline-latest`.

## Uso rapido
- Colori: clic su una riga della palette, poi disegna. Codici DB e tinte sono modificabili.
- **Generatore**: scegli motivo, righe per modulo e i colori degli anelli (centro -> sfondo).
- **Stampa / PDF**: pagina 1 schema con lettere e legenda, pagina 2 lettura riga per riga
  (`A3 B A2` = 3 perline A, 1 B, 2 A).
- "1 rp." = 200 perline (dedotto dagli schemi di riferimento: 220 perline = 1,1 rp.).
  Telaio: fili di ordito = larghezza + 1, ordito = lunghezza + 40 cm di sprechi, trama = ogni riga attraversa due volte la larghezza. Misure perlina (1,6 x 1,3 mm) e fili sono **stime**.

## Sviluppo
```
python perline.py            # avvia l'app
python -m pytest tests
node tests/core.test.js
```
