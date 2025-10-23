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

<<<<<<< HEAD
app.get("/dipendente.html", (req, res) => {
  res.sendFile(path.join(__dirname, "dipendente.html"));
});

app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

// MongoDB setup
=======
>>>>>>> 3f57e8bfca244b852d40eaf56312d0b83b7e5d1e
const uri = "mongodb+srv://Giorgia7:100602@servizi.pjgbb1q.mongodb.net/";
const client = new MongoClient(uri);
let db;

// Creazione ticket
app.post("/api/ticket", async (req, res) => {
  try {
    const { operazione } = req.body;

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
      fk_coda: best._id, // store ObjectId
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
        $project: {
          id: { $toString: "$_id" }, 
          tempo_attesa_ticket: "$tempo_attesa",
          orario: 1,
          numero_sportello: "$coda_info.numero_sportello",
          tempo_attesa_coda: "$coda_info.tempo_attesa"
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
    // Find the oldest (or first-in-queue) ticket for this sportello
    const nextTicket = await db.collection("Utenti").findOne(
      { numero_sportello },
      { sort: { _id: 1 } } // earliest inserted
    );

    if (!nextTicket) {
      return res.status(404).json({ message: "Nessun utente in attesa." });
    }

    // Remove that ticket
    await db.collection("Utenti").deleteOne({ _id: nextTicket._id });

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