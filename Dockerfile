# Usa l'immagine ufficiale di Node.js
FROM node:20-alpine

# Imposta la directory di lavoro all'interno del container
WORKDIR /app

# Copia i file package.json e package-lock.json e installa le dipendenze
# Questo passaggio è ottimizzato per sfruttare il caching di Docker
COPY package*.json ./
RUN npm install

# Copia il resto dei file dell'applicazione
# Copia tutti i file necessari per l'esecuzione del server.js e i file statici
COPY . .

# Il backend Node.js è configurato per ascoltare sulla porta 3000 (vedi server.js)
EXPOSE 3000

# Comando per avviare l'applicazione
# "start" è definito nel tuo package.json come "node server.js"
CMD [ "npm", "start" ]