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

// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Utente.html"));
});

// MongoDB setup
const uri = "mongodb+srv://Giorgia7:100602@servizi.pjgbb1q.mongodb.net/";
const client = new MongoClient(uri);
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("GestionalePoste");
    console.log("MongoDB connected");

    // Ensure sportelli (Coda) exist with allowed services
    const coda = db.collection("Coda");
    const existing = await coda.find().toArray();
    if (existing.length === 0) {
      const sportelli = [
        { numero_sportello: 1, tempo_totale: 0, servizi: ["Invio pacchi/lettere", "Deposito denaro", "Bonifico"] },
        { numero_sportello: 2, tempo_totale: 0, servizi: ["Ritiro pensione", "Pagamento bollette/bollettini", "Ricarica Postepay"] },
        { numero_sportello: 3, tempo_totale: 0, servizi: ["Apertura conto Poste", "Ricarica Postepay", "Pagamento bollo auto e moto"] },
        { numero_sportello: 4, tempo_totale: 0, servizi: ["Richiesta passaporto", "Ricarica telefonica", "Deposito denaro"] },
        { numero_sportello: 5, tempo_totale: 0, servizi: ["Ritiro denaro", "Pagamento bollo auto e moto", "Pagamento bollette/bollettini"] },
        { numero_sportello: 6, tempo_totale: 0, servizi: ["Bonifico", "Ritiro pacchi/lettere", "Ricarica telefonica"] },
        { numero_sportello: 7, tempo_totale: 0, servizi: ["Ritiro pacchi/lettere", "Invio pacchi/lettere", "Ricarica telefonica"] },
        { numero_sportello: 8, tempo_totale: 0, servizi: ["Deposito denaro", "Ritiro denaro", "Richiesta passaporto"] },
        { numero_sportello: 9, tempo_totale: 0, servizi: ["Pagamento bollo auto e moto", "Ricarica Postepay", "Apertura conto Poste"] }
      ];
      await coda.insertMany(sportelli);
      console.log("9 sportelli (Coda) inizializzati con servizi");
    }
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}
connectDB();

// Add a new ticket (Utente)
app.post("/api/ticket", async (req, res) => {
  try {
    const { id, operazione, tempo_operazione } = req.body;
    const coda = db.collection("Coda");
    const utenti = db.collection("Utenti");

    // Find sportelli that can handle this operation
    const eligible = await coda.find({ servizi: operazione }).sort({ tempo_totale: 1 }).toArray();
    if (eligible.length === 0) {
      return res.status(400).json({ message: "Nessuno sportello disponibile per questa operazione" });
    }

    // Pick the sportello with smallest waiting time
    const best = eligible[0];
    const sportelloId = best._id;
    const oldTempoTotale = best.tempo_totale || 0;
    const newTempoTotale = oldTempoTotale + tempo_operazione;

    // Update sportello total waiting time
    await coda.updateOne(
      { _id: sportelloId },
      { $set: { tempo_totale: newTempoTotale } }
    );

    // Insert ticket
    const now = new Date();
    const newTicket = {
      id,
      fk_coda: sportelloId,
      tempo_attesa: oldTempoTotale,
      Orario: now
    };
    const result = await utenti.insertOne(newTicket);
    if (!result.acknowledged) throw new Error("Insert failed");

    // Respond to frontend
    res.json({
      message: "Ticket salvato con successo",
      fk_coda: sportelloId,
      tempo_attesa: oldTempoTotale,
      orario: now
    });

  } catch (err) {
    console.error("Errore salvataggio ticket:", err);
    res.status(500).json({ message: "Errore nel salvataggio del ticket" });
  }
});

// Get all tickets with Coda info
app.get("/api/tickets-with-coda", async (req, res) => {
  try {
    const utenti = db.collection("Utenti");

    const tickets = await utenti.aggregate([
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
          Orario: 1,
          numero_sportello: "$coda_info.numero_sportello",
          coda_tempo_totale: "$coda_info.tempo_totale"
        }
      },
      { $sort: { Orario: 1 } }
    ]).toArray();

    res.json(tickets);
  } catch (err) {
    console.error("Errore fetching tickets with coda:", err);
    res.status(500).json({ message: "Errore nel recupero dei ticket" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});