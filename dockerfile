# Usa un'immagine leggera di Node
FROM node:20-alpine

# Imposta la directory di lavoro
WORKDIR /app

# Copia i file di dipendenze
COPY package*.json ./

# Installa solo le dipendenze necessarie
RUN npm install --production

# Copia tutto il codice dell’app (HTML, CSS, JS, ecc.)
COPY . .

# Espone la porta del server
EXPOSE 3000

# Avvia l’applicazione
CMD ["node", "Server.js"]
