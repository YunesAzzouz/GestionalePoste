// DOM elements
const btnGenera = document.querySelector('.btn-genera-biglietto');
const selectOperazione = document.getElementById('operazione-scelta');
const ticketBox = document.getElementById('biglietto-emesso');
const ticketNumero = document.getElementById('ticket-numero');
const ticketOperazione = document.getElementById('ticket-operazione');
const ticketSportello = document.getElementById('ticket-sportello');

// Initialize localStorage ticket counter if not existing
if (!localStorage.getItem('ticketCounter')) {
  localStorage.setItem('ticketCounter', '0');
}

// Handle ticket generation
btnGenera.addEventListener('click', () => {
  const operazione = selectOperazione.value;

  if (!operazione) {
    alert("⚠️ Seleziona un'operazione prima di creare il biglietto!");
    return;
  }

  // Increment ticket counter
  let counter = parseInt(localStorage.getItem('ticketCounter')) + 1;
  localStorage.setItem('ticketCounter', counter.toString());

  // Format ticket number (e.g., B001, B002, etc.)
  const ticketNumber = `B${String(counter).padStart(3, '0')}`;

  // Random sportello (1–3 for now)
  const sportello = Math.floor(Math.random() * 3) + 1;

  // Display generated ticket
  ticketNumero.textContent = ticketNumber;
  ticketOperazione.textContent = operazione;
  ticketSportello.textContent = `Sportello ${sportello}`;
  ticketBox.style.display = 'block';
});
