# ---- Base Node image ----
FROM node:20

WORKDIR /usr/src/app

# Copy only package files first (for efficient caching)
COPY package*.json ./

RUN npm install

# Copy rest of app
COPY . .

EXPOSE 3000

CMD ["node", "Server.js"]