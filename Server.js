const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;
app.use(cors());
app.use(bodyParser.json());

const uri = 'mongodb+srv://Giorgia7:100602@servizi.pjgbb1q.mongodb.net/';
const client = new MongoClient(uri);
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("GestionalePoste");
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}
connectDB();

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});