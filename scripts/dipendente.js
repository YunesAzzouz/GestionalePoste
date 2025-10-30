document.addEventListener("DOMContentLoaded", async () => {
  const numeroSportello = window.numeroSportello;
  const queueBody = document.getElementById("queueBody");
  const currentInfo = document.getElementById("currentInfo");

  async function aggiornaTabella() {
    try {
      const res = await fetch("http://localhost:3000/api/tickets-with-coda");
      const allTickets = await res.json();
      const queue = allTickets.filter(t => t.numero_sportello === numeroSportello);

      queueBody.innerHTML = "";
      if (!queue.length) {
        queueBody.innerHTML = "<tr><td colspan='2'>Nessun utente in attesa</td></tr>";
        currentInfo.textContent = "Nessun utente";
        return;
      }

      queue.forEach(u => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${u.numero_ticket || "?"}</td><td>${u.fk_servizio || "N/A"}</td>`;
        queueBody.appendChild(tr);
      });

      const current = queue[0];
      currentInfo.textContent = `Ticket ${current.numero_ticket} - ${current.fk_servizio}`;
    } catch (err) {
      console.error("Errore aggiornamento tabella:", err);
    }
  }

  document.getElementById("nextBtn").addEventListener("click", async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/tickets/next/${numeroSportello}`, { method: "DELETE" });
      if (res.status === 404) {
        currentInfo.textContent = "Nessun utente in attesa.";
        aggiornaTabella();
        return;
      }
      const data = await res.json();
      console.log("Ticket rimosso:", data.removedTicket);
      aggiornaTabella();
    } catch (err) {
      console.error("Errore eliminazione utente:", err);
    }
  });

  document.getElementById("endBtn").addEventListener("click", () => {
    currentInfo.textContent = "Servizio terminato.";
  });

  await aggiornaTabella();
  setInterval(aggiornaTabella, 10000);
});