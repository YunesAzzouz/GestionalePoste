document.addEventListener("DOMContentLoaded", async () => {
  const servicesTable = document.getElementById("servicesTable");
  const sportelliTable = document.getElementById("sportelliTable");
  let currentRange = "all";

  function getDateRange(range) {
    const now = new Date();
    let start;
    switch (range) {
      case "day": start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case "week": start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()); break;
      case "month": start = new Date(now.getFullYear(), now.getMonth(), 1); break;
      default: start = new Date(0);
    }
    return start;
  }

  async function loadStats(range = "all") {
    try {
      currentRange = range;

      // Statistica 1
      const res1 = await fetch(`http://localhost:3000/api/stats/services?range=${range}`);
      const statsServices = await res1.json();
      servicesTable.innerHTML = "";
      statsServices.forEach(s => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${s._id}</td><td>${s.clientiServiti}</td>`;
        servicesTable.appendChild(tr);
      });

      // Statistica 2
      const res2 = await fetch(`http://localhost:3000/api/stats/sportelli?range=${range}`);
      const statsSportelli = await res2.json();
      sportelliTable.innerHTML = "";
      statsSportelli.forEach(s => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${s._id.sportello}</td><td>${s._id.servizio}</td><td>${s.clientiServiti}</td>`;
        sportelliTable.appendChild(tr);
      });

    } catch (err) {
      console.error("Errore caricamento statistiche:", err);
    }
  }

  // Filter buttons
  document.getElementById("filter-day").addEventListener("click", () => loadStats("day"));
  document.getElementById("filter-week").addEventListener("click", () => loadStats("week"));
  document.getElementById("filter-month").addEventListener("click", () => loadStats("month"));

  // Auto-refresh every 60s
  setInterval(() => loadStats(currentRange), 60000);

  // Initial load
  await loadStats();
});