const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Utente.html"));
});

app.get("/dipendente.html", (req, res) => {
  res.sendFile(path.join(__dirname, "dipendente.html"));
});

app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

// MongoDB setup
const uri = process.env.MONGODB_URI || "mongodb+srv://Giorgia7:100602@servizi.pjgbb1q.mongodb.net/";
const client = new MongoClient(uri);
let db;

// Creazione ticket
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
      numero_sportello: sportelloNumero,  // store the sportello here
      tempo_attesa: oldTempo + servizio.tempo_medio,
      orario: now
    };



    const insertResult = await utentiCollection.insertOne(newTicket);

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
    nome_servizio: { $arrayElemAt: ["$servizio_info.nome_servizio", 0] }
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

// Serve next ticket for a specific sportello and remove it from DB
app.delete("/api/tickets/next/:numero_sportello", async (req, res) => {
  const numero_sportello = Number(req.params.numero_sportello);

  try {
    console.log("→ DELETE request received for sportello:", numero_sportello);
    const utentiCollection = db.collection("Utenti");
    const codaCollection = db.collection("Coda");
    const serviziCollection = db.collection("Servizi");

    // Find the oldest (first) ticket for this sportello
    const nextTicket = await utentiCollection.findOne(
      { numero_sportello },
      { sort: { _id: 1 } }
    );

    console.log("Found nextTicket:", nextTicket);

    if (!nextTicket) {
      return res.status(404).json({ message: "Nessun utente in attesa." });
    }

    // Fetch related coda document
    const coda = await codaCollection.findOne({ numero_sportello });
    console.log("Found coda:", coda);
    if (coda) {
      // Find one of the services this sportello serves
      const servizio = await serviziCollection.findOne({
        nome_servizio: { $in: coda.servizi }
      });
      console.log("Found servizio:", servizio);

      // Decrement tempo_attesa safely
      const decrement = servizio?.tempo_medio || 0;
      await codaCollection.updateOne(
        { _id: coda._id },
        { $inc: { tempo_attesa: -decrement } }
      );
    }

    // Remove that ticket
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