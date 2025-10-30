const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const axios = require("axios");

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "utente.html"));
});

app.get("/dipendente.html", (req, res) => {
  res.sendFile(path.join(__dirname, "dipendente.html"));
});

app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

const uri = process.env.MONGODB_URI || "mongodb+srv://Giorgia7:100602@servizi.pjgbb1q.mongodb.net/";
const client = new MongoClient(uri);
let db;

app.post("/api/ticket", async (req, res) => {
  try {
    const { operazione, id } = req.body;

    if (!operazione) {
      return res.status(400).json({ message: "Operazione non fornita" });
    }

    const serviziCollection = db.collection("Servizi");
    const codaCollection = db.collection("Coda");
    const utentiCollection = db.collection("Utenti");

    const servizio = await serviziCollection.findOne({
      nome_servizio: { $regex: new RegExp(`^${operazione.trim()}$`, "i") }
    });

    if (!servizio) {
      return res.status(400).json({ message: "Servizio non trovato" });
    }

    const eligible = await codaCollection
      .find({ servizi: { $in: [operazione] } })
      .sort({ tempo_attesa: 1 })
      .toArray();

    if (!eligible || eligible.length === 0) {
      return res.status(400).json({ message: "Nessuno sportello disponibile per questo servizio" });
    }

    const best = eligible[0];
    const sportelloNumero = best.numero_sportello || null;
    const oldTempo = best.tempo_attesa || 0;

    const now = new Date();
    const newTicket = {
      fk_coda: best._id,
      numero_ticket: id,
      numero_sportello: sportelloNumero,
      tempo_attesa: oldTempo + servizio.tempo_medio,
      orario: now,
      fk_servizio: operazione
    };

    await utentiCollection.insertOne(newTicket);
    await codaCollection.updateOne(
      { _id: best._id },
      { $inc: { tempo_attesa: servizio.tempo_medio } }
    );

    res.json({
      message: "Ticket creato con successo",
      numero_sportello: sportelloNumero,
      tempo_attesa: oldTempo,
      orario: now
    });

  } catch (err) {
    console.error("Errore creazione ticket:", err);
    res.status(500).json({ message: "Errore creazione ticket" });
  }
});

app.get("/api/tickets-with-coda", async (req, res) => {
  try {
    const utenti = db.collection("Utenti");

    const result = await utenti.aggregate([
      {
        $lookup: {
          from: "Coda",
          localField: "fk_coda",
          foreignField: "_id",
          as: "coda_info"
        }
      },
      { $unwind: "$coda_info" },
      {
        $lookup: {
          from: "Servizi",
          localField: "coda_info.servizi",
          foreignField: "nome_servizio",
          as: "servizio_info"
        }
      },
      {
        $project: {
          id: { $toString: "$_id" },
          numero_ticket: 1,
          orario: 1,
          numero_sportello: "$coda_info.numero_sportello",
          tempo_attesa_coda: "$coda_info.tempo_attesa",
          nome_servizio: { $arrayElemAt: ["$servizio_info.nome_servizio", 0] },
          fk_servizio: "$fk_servizio",
          tempo_medio: { $arrayElemAt: ["$servizio_info.tempo_medio", 0] }
        }
      },
      { $sort: { orario: 1 } }
    ]).toArray();

    res.json(result);
  } catch (err) {
    console.error("Errore fetch tickets:", err);
    res.status(500).json({ message: "Errore nel recupero dei ticket" });
  }
});

app.delete("/api/tickets/next/:numero_sportello", async (req, res) => {
  const numero_sportello = Number(req.params.numero_sportello);

  try {
    console.log("→ DELETE request received for sportello:", numero_sportello);
    const utentiCollection = db.collection("Utenti");
    const codaCollection = db.collection("Coda");
    const serviziCollection = db.collection("Servizi");

    const nextTicket = await utentiCollection.findOne(
      { numero_sportello },
      { sort: { _id: 1 } }
    );

    if (!nextTicket) {
      return res.status(404).json({ message: "Nessun utente in attesa." });
    }

    const coda = await codaCollection.findOne({ numero_sportello });
    if (coda) {
      const servizio = await serviziCollection.findOne({
        nome_servizio: { $in: coda.servizi }
      });

      const decrement = servizio?.tempo_medio || 0;
      await codaCollection.updateOne(
        { _id: coda._id },
        { $inc: { tempo_attesa: -decrement } }
      );
    }

    await utentiCollection.deleteOne({ _id: nextTicket._id });

    res.json({
      message: "Utente servito e rimosso dalla coda.",
      removedTicket: nextTicket
    });
  } catch (err) {
    console.error("Errore eliminazione ticket:", err);
    res.status(500).json({ error: "Errore del server." });
  }
});

app.get("/api/coda", async (req, res) => {
  try {
    const codaCollection = db.collection("Coda");
    const codaList = await codaCollection.find().toArray();
    res.json(codaList.map(c => ({
      numero_sportello: c.numero_sportello,
      tempo_attesa: c.tempo_attesa || 0
    })));
  } catch (err) {
    console.error("Errore fetch coda:", err);
    res.status(500).json({ message: "Errore nel recupero della coda" });
  }
});

function getDateRange(range) {
  const now = new Date();
  let start;

  switch (range) {
    case "day":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      const day = now.getDay();
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      start = new Date(0);
  }

  return start;
}

app.get("/api/stats/services", async (req, res) => {
  try {
    const range = req.query.range || "all";
    const startDate = getDateRange(range);

    const utenti = db.collection("Utenti");
    const stats = await utenti.aggregate([
      { $match: { orario: { $gte: startDate } } },
      {
        $group: {
          _id: "$fk_servizio",
          clientiServiti: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    res.json(stats);
  } catch (err) {
    console.error("Errore stats servizi:", err);
    res.status(500).json({ message: "Errore nel recupero statistiche" });
  }
});

app.get("/api/stats/sportelli", async (req, res) => {
  try {
    const range = req.query.range || "all";
    const startDate = getDateRange(range);

    const utenti = db.collection("Utenti");
    const stats = await utenti.aggregate([
      { $match: { orario: { $gte: startDate } } },
      {
        $group: {
          _id: {
            sportello: "$numero_sportello",
            servizio: "$fk_servizio"
          },
          clientiServiti: { $sum: 1 }
        }
      },
      { $sort: { "_id.sportello": 1, "_id.servizio": 1 } }
    ]).toArray();

    res.json(stats);
  } catch (err) {
    console.error("Errore stats sportelli:", err);
    res.status(500).json({ message: "Errore nel recupero statistiche" });
  }
});

const KEYCLOAK_BASE = process.env.KEYCLOAK_BASE || "http://localhost:8080";
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || "PosteApp";
const KC_CLIENT_ID = process.env.KC_CLIENT_ID;
const KC_CLIENT_SECRET = process.env.KC_CLIENT_SECRET;

app.get("/api/utente-profile", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization header missing" });
    }
    const token = auth.split(" ")[1];
    const userinfoUrl = `${KEYCLOAK_BASE}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/userinfo`;

    const response = await axios.get(userinfoUrl, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000
    });

    res.json(response.data);
  } catch (err) {
    console.error("Errore userinfo:", err.response?.data || err.message);
    const status = err.response?.status || 500;
    res.status(status).json({ message: "Errore recupero profilo utente", details: err.response?.data || err.message });
  }
});

async function getAdminToken() {
  const tokenUrl = `${KEYCLOAK_BASE}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", KC_CLIENT_ID);
  params.append("client_secret", KC_CLIENT_SECRET);

  const resp = await axios.post(tokenUrl, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  return resp.data.access_token;
}

app.get("/api/utenteByEmail/:email", async (req, res) => {
  const email = decodeURIComponent(req.params.email.trim());
  try {
    const adminToken = await getAdminToken();
    const adminUrl = `${KEYCLOAK_BASE}/admin/realms/${KEYCLOAK_REALM}/users?email=${encodeURIComponent(email)}`;

    const resp = await axios.get(adminUrl, {
      headers: { Authorization: `Bearer ${adminToken}` },
      timeout: 5000
    });

    const users = resp.data || [];
    if (users.length === 0)
      return res.status(404).json({ message: "Utente non trovato in Keycloak" });

    res.json(users[0]);
  } catch (err) {
    console.error("Errore Keycloak admin lookup:", err.response?.data || err.message);
    const status = err.response?.status || 500;
    res.status(status).json({ message: "Errore recupero utente da Keycloak", details: err.response?.data || err.message });
  }
});

async function startServer() {
  try {
    await client.connect();
    db = client.db("GestionalePoste");
    console.log("MongoDB connected");

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

startServer();
