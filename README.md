# GestionalePoste

Gestione semplice di code e ticket per un ufficio postale (progetto didattico).

Questo repository contiene un backend Node.js (Express) che espone API per la gestione di ticket e code, pagine frontend statiche (HTML/CSS/JS) per utenti, dipendenti e admin, e una configurazione Keycloak preconfigurata per l'autenticazione.

## Caratteristiche principali

- Creazione ticket per diversi servizi
- Calcolo tempo di attesa stimato per sportello
- Visualizzazione e gestione della coda per sportelli
- Endpoint statistici per admin (clienti serviti per servizio e per sportello)
- Autenticazione e ruoli gestiti tramite Keycloak (realm `PosteApp`)
- Possibilità di avviare l'intero stack via Docker Compose

## Tech stack

- Node.js 20 (immagine Docker usata: node:20-alpine)
- Express
- MongoDB (connessione via URI, esempio usa MongoDB Atlas nel file di esempio)
- Keycloak per autenticazione (realm preconfigurato in `docker/key-cloak/realm-export.json`)

## Struttura rilevante

- `Server.js` - server Express principale e definizione API
- `package.json` - dipendenze e script
- `docker-compose.yml` - compose per Keycloak + backend
- `Dockerfile` - Dockerfile per il backend
- `docker/key-cloak/realm-export.json` - configurazione del realm Keycloak (PosteApp)
- `Utente.html`, `dipendente.html`, `admin.html` - frontend statico
- `scripts/` - JavaScript client (Keycloak init, ticket, ecc.)

## Requisiti

- Node.js (consigliato >= 20)
- npm
- Docker & Docker Compose (per avviare Keycloak + backend in container)
- Un'istanza MongoDB (Atlas o locale) o usare la stringa `MONGODB_URI` nell'environment

## Configurazione e avvio (locale)

1. Installa le dipendenze:

```powershell
npm install
```

2. Imposta le variabili d'ambiente (esempio):

- `MONGODB_URI` — stringa di connessione a MongoDB (default nel codice punta a un Atlas)
- `KEYCLOAK_URL` — URL di Keycloak (es. `http://localhost:8080`)
- `KEYCLOAK_REALM` — `PosteApp` (come nel realm-export)
- `KEYCLOAK_CLIENT` — `poste-frontend`

Esempio (PowerShell):

```powershell
# $env:MONGODB_URI = "mongodb+srv://username:password@cluster.mongodb.net/"
# $env:KEYCLOAK_URL = "http://localhost:8080"
# $env:KEYCLOAK_REALM = "PosteApp"
# $env:KEYCLOAK_CLIENT = "poste-frontend"
```

3. Avvia il server:

```powershell
npm start
```

Il server ascolta di default su `http://localhost:3000` (vedi `Server.js`). Le pagine principali sono raggiungibili come file statici all'URL root (`Utente.html` viene servito per `/`).

## Avvio con Docker Compose (consigliato per sviluppo rapido)

Questo repository contiene un `docker-compose.yml` che avvia Keycloak e il backend.

1. Costruisci e avvia i servizi:

```powershell
docker-compose up --build
```

2. Keycloak sarà raggiungibile su `http://localhost:8080` (credenziali admin impostate nel compose: `admin` / `admin`). Il backend esporrà la porta `3000`.

Note:
- Il realm preconfigurato si chiama `PosteApp` e il client frontend è `poste-frontend` (redirect su `http://localhost:3000/*`).
- Se usi Docker Compose, le variabili `KEYCLOAK_URL`, `KEYCLOAK_REALM` e `KEYCLOAK_CLIENT` sono già impostate nel servizio `backend` del `docker-compose.yml`.

## Endpoint API principali

Il backend espone le seguenti API (implementate in `Server.js`):

- POST /api/ticket — crea un ticket
- GET /api/tickets-with-coda — ritorna i ticket con informazioni sulla coda collegata
- DELETE /api/tickets/next/:numero_sportello — serve (rimuove) il prossimo ticket per lo sportello
- GET /api/coda — lista degli sportelli e tempi di attesa
- GET /api/stats/services?range={day|week|month|all} — statistiche clienti per servizio
- GET /api/stats/sportelli?range={day|week|month|all} — statistiche per sportello e servizio

Esempio di chiamata per creare un ticket (curl):

```powershell
curl -X POST http://localhost:3000/api/ticket -H "Content-Type: application/json" -d '{"operazione":"Pagamento bollette/bollettini","id":"A001"}'
```

## Dettagli Keycloak (come è configurato)

- Realm: `PosteApp` (file: `docker/key-cloak/realm-export.json`)
- Client frontend: `poste-frontend` (public client, redirect su `http://localhost:3000/*`)
- Utenti di esempio: `admin`, `sportello1`, `sportello2`, ... (inseriti nel realm-export)

Quando Keycloak è attivo, i file JS frontend (es. `scripts/keycloak.js`) inizializzano il client Keycloak e reindirizzano l'utente in base al `userType` (admin/dipendente/utente).

## Frontend

Le pagine principali si trovano nella root del progetto come file statici:

- `Utente.html` — pagina pubblica per generare ticket
- `dipendente.html` — interfaccia per dipendenti/sportelli
- `admin.html` — dashboard admin con statistiche

I file JS che gestiscono la logica client si trovano in `scripts/` (es. `ticket.js`, `keycloak.js`).

## Contributi

Pull request benvenute. Prima di aprire PR, assicurati che le modifiche non rompano la compatibilità con il formato degli oggetti in MongoDB e che le nuove dipendenze siano necessarie.

## Licenza

Per default non è specificata una licenza nel `package.json`. Aggiungi una licenza nel repository se necessario.

## Contatti / Note finali

Questo progetto è pensato come prototipo/dimostrazione per la gestione di code in un contesto postale. Se vuoi che estenda il README con diagrammi, esempi di DB seed, o istruzioni passo-passo per la configurazione di MongoDB Atlas, dimmi cosa preferisci e lo aggiungo.