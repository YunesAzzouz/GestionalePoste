document.addEventListener("DOMContentLoaded", () => {

  const btnGenera = document.querySelector('.btn-genera-biglietto');
  const selectOperazione = document.getElementById('operazione-scelta');
  const ticketBox = document.getElementById('biglietto-emesso');
  const ticketNumero = document.getElementById('ticket-numero');
  const ticketOperazione = document.getElementById('ticket-operazione');
  const ticketSportello = document.getElementById('ticket-sportello');

  const operazioniMap = {
    "Pagamento bollette/bollettini": { prefix: "A", time: 7 },
    "Invio pacchi/lettere": { prefix: "B", time: 14 },
    "Ritiro pacchi/lettere": { prefix: "C", time: 9 },
    "Pagamento bollo auto e moto": { prefix: "D", time: 6 },
    "Ricarica Postepay": { prefix: "E", time: 3 },
    "Ricarica telefonica": { prefix: "F", time: 3 },
    "Bonifico": { prefix: "G", time: 7 },
    "Ritiro pensione": { prefix: "H", time: 10 },
    "Deposito denaro": { prefix: "I", time: 6 },
    "Ritiro denaro": { prefix: "L", time: 10 },
    "Apertura conto Poste": { prefix: "M", time: 25 },
    "Richiesta passaporto": { prefix: "N", time: 22 }
  };

  for (const key in operazioniMap) {
    const prefix = operazioniMap[key].prefix;
    if (!localStorage.getItem(`counter_${prefix}`)) localStorage.setItem(`counter_${prefix}`, '0');
  }

  btnGenera.addEventListener('click', async () => {
    const operazione = selectOperazione.value;
    if (!operazione) return alert("Seleziona un'operazione prima di creare il biglietto!");

    const { prefix, time } = operazioniMap[operazione];
    let counter = parseInt(localStorage.getItem(`counter_${prefix}`)) + 1;
    localStorage.setItem(`counter_${prefix}`, counter.toString());
    const ticketNumber = `${prefix}${String(counter).padStart(3, '0')}`;

    try {
      const res = await fetch("http://localhost:3000/api/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operazione,
          id: ticketNumber,
          tempo_operazione: time,
          fk_servizio: operazione
        })
      });

      const data = await res.json();

      const ticketsRes = await fetch("http://localhost:3000/api/tickets-with-coda");
      const allTickets = await ticketsRes.json();
      const ticketsForSportello = allTickets.filter(t => t.numero_sportello === data.numero_sportello);

      const estimatedWait = ticketsForSportello.reduce((sum, t) => sum + (t.tempo_medio || 0), 0);

      ticketNumero.textContent = ticketNumber;
      ticketOperazione.textContent = operazione;
      ticketSportello.textContent = `Sportello ${data.numero_sportello} (Attesa stimata: ${estimatedWait} min)`;
      ticketBox.style.display = 'block';

      updateAttesaTable(); 
    } catch (err) {
      console.error("Errore:", err);
      alert("Errore durante la creazione del biglietto");
    }
  });

  async function updateAttesaTable() {
    try {
      const res = await fetch("http://localhost:3000/api/tickets-with-coda");
      const allTickets = await res.json();

      for (let i = 1; i <= 9; i++) {
        const row = document.getElementById(`sportello-${i}`);
        if (!row) continue;
        const tempoCell = row.querySelector(".tempo-rimanente");

        const ticketsForSportello = allTickets.filter(t => t.numero_sportello === i);

        const totalTime = ticketsForSportello.reduce((sum, t) => sum + (t.tempo_medio || 0), 0);

        tempoCell.textContent = `${totalTime} min`;
      }
    } catch (err) {
      console.error("Errore aggiornamento tabella attesa:", err);
    }
  }

  updateAttesaTable();
  setInterval(updateAttesaTable, 10000);
});