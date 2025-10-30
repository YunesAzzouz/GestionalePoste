# GestionalePoste

Gestione semplice di code e ticket per un ufficio postale — progetto didattico.

Questo repository contiene un backend Node.js (Express) che espone API per la gestione di ticket e code, pagine frontend statiche (HTML/CSS/JS) per utenti, dipendenti e admin, e una configurazione Keycloak preconfigurata per l'autenticazione.

## Caratteristiche principali

- Creazione di ticket per diversi servizi
- Stima del tempo di attesa per sportello
- Visualizzazione e gestione della coda per ogni sportello
- Endpoint statistici per admin (clienti serviti per servizio e per sportello)
- Autenticazione e ruoli gestiti tramite Keycloak (realm `PosteApp`)
- Avvio dell'intero stack tramite Docker Compose

## Tech stack

- Node.js (consigliato >= 20; immagine Docker usata: `node:20-alpine`)
- Express
- MongoDB (connessione via URI — nell'esempio si usa MongoDB Atlas)
- Keycloak per l'autenticazione (realm preconfigurato in `docker/key-cloak/realm-export.json`)

## Struttura rilevante

- `server.js` - server Express principale e definizione delle API
- `package.json` - dipendenze e script
- `docker-compose.yml` - compose per Keycloak + backend
- `Dockerfile` - Dockerfile per il backend
- `docker/key-cloak/realm-export.json` - configurazione del realm Keycloak (`PosteApp`)
- `utente.html`, `dipendente.html`, `admin.html` - frontend statico
- `scripts/` - JavaScript client

## Struttura del progetto

Di seguito una vista ad albero (semplificata) dei file e delle cartelle principali presenti nel repository:

```
GestionalePoste/
├─ admin.html
├─ dipendente.html
├─ utente.html
├─ Server.js
├─ package.json
├─ package-lock.json
├─ README.md
├─ Dockerfile
├─ docker-compose.yml
├─ CSS/
│  ├─ admin.css
│  ├─ dipendente.css
│  ├─ style.css
│  └─ utente.css
├─ docker/
│  └─ key-cloak/
│     ├─ Dockerfile
│     └─ realm-export.json
├─ img/
├─ scripts/
│  ├─ admin.js
│  ├─ dipendente.js
│  ├─ keycloak.js
│  └─ ticket.js
└─ node_modules/ (presente localmente; di solito ignorata nel controllo versione)
```


## Requisiti

- Node.js (consigliato >= 20)
- npm
- Docker & Docker Compose (opzionali, solo per avviare Keycloak e il backend in container)
- Un'istanza MongoDB (Atlas o locale) o una stringa di connessione impostata via `MONGODB_URI`

## Avvio con Docker Compose (opzione rapida)

Il file `docker-compose.yml` presente nel repository può avviare Keycloak e il backend in container per un setup veloce.

1. Costruisci e avvia i servizi:

```powershell
docker-compose up --build
```

2. Dopo l'avvio:

- Keycloak sarà raggiungibile su `http://localhost:8080` (credenziali admin predefinite nel compose: `admin` / `admin` — verifica il file `docker-compose.yml`).
- Il backend sarà esposto su `http://localhost:3000`.

Note:

- Il realm preconfigurato si chiama `PosteApp` e il client frontend è `poste-frontend` (redirect verso `http://localhost:3000/*`).
- Quando avvii tramite Docker Compose, le variabili `KEYCLOAK_URL`, `KEYCLOAK_REALM` e `KEYCLOAK_CLIENT` dovrebbero essere già configurate per il servizio `backend`.

## Endpoint API principali

Di seguito alcuni endpoint esposti dal backend (implementati in `server.js`):

- POST /api/ticket — crea un ticket
- GET /api/tickets-with-coda — restituisce i ticket con informazioni sulla coda collegata
- DELETE /api/tickets/next/:numero_sportello — serve (rimuove) il prossimo ticket per lo sportello specificato
- GET /api/coda — lista degli sportelli e tempi di attesa
- GET /api/stats/services?range={day|week|month|all} — statistiche clienti per servizio
- GET /api/stats/sportelli?range={day|week|month|all} — statistiche per sportello e per servizio

## Dettagli Keycloak

- Realm: `PosteApp` (file: `docker/key-cloak/realm-export.json`)
- Client frontend: `poste-frontend` (public client, redirect verso `http://localhost:3000/*`)
- Utenti di esempio inclusi nell'export: `admin`, `sportello1`, `sportello2`, ecc.

Quando Keycloak è attivo, i file JS frontend (es. `scripts/keycloak.js`) inizializzano il client Keycloak e gestiscono i redirect in base al ruolo/`userType` (admin/dipendente/utente).

## Frontend

Le pagine principali (file statici nella root) sono:

- `utente.html` — pagina pubblica per generare ticket
- `dipendente.html` — interfaccia per i dipendenti/sportelli
- `admin.html` — dashboard per gli amministratori

La logica client è in `scripts/` (es. `ticket.js`, `keycloak.js`).

## Autori
 - [YunesAzzouz]
 - [GiorgiaSettimi]
 - [SimoneCerqueti]
 - [ManuelMurru]
 - [EmanueleProfili]