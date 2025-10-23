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

// MongoDB setup
const uri = "mongodb+srv://Giorgia7:100602@servizi.pjgbb1q.mongodb.net/";
const client = new MongoClient(uri);
let db;

// Create a new ticket
app.post("/api/ticket", async (req, res) => {
  try {
    const { operazione } = req.body;

    if (!operazione) {
      return res.status(400).json({ message: "Operazione non fornita" });
    }

    const serviziCollection = db.collection("Servizi");
    const codaCollection = db.collection("Coda");
    const utentiCollection = db.collection("Utenti");

    // Find the corresponding service (case-insensitive)
    const servizio = await serviziCollection.findOne({
      nome_servizio: { $regex: new RegExp(`^${operazione.trim()}$`, "i") }
    });

    if (!servizio) {
      return res.status(400).json({ message: "Servizio non trovato" });
    }

    // Find eligible sportelli
    const eligible = await codaCollection
      .find({ servizi: { $in: [operazione] } })
      .sort({ tempo_attesa: 1 })
      .toArray();

    if (!eligible || eligible.length === 0) {
      return res.status(400).json({ message: "Nessuno sportello disponibile per questo servizio" });
    }

    // Choose the sportello with lowest tempo_attesa
    const best = eligible[0];
    const sportelloNumero = best.numero_sportello || null;
    const oldTempo = best.tempo_attesa || 0;

    // Create new ticket
    const now = new Date();
    const newTicket = {
      fk_coda: best._id, // store ObjectId
      tempo_attesa: oldTempo + servizio.tempo_medio,
      orario: now
    };

    const insertResult = await utentiCollection.insertOne(newTicket);

    // Update sportello wait time
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

// 🟢 Get all tickets with their sportello + servizio info
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
          id: 1,
          tempo_attesa: 1,
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

async function startServer() {
  try {
    await client.connect();
    db = client.db("GestionalePoste");
    console.log("MongoDB connected");

    // Start the server only after DB is connected
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

startServer();