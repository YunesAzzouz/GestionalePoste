document.addEventListener("DOMContentLoaded", async () => {
  window.keycloak = new Keycloak({
    url: "http://localhost:8080",
    realm: "PosteApp",
    clientId: "poste-frontend"
  });

  try {
    await keycloak.init({ onLoad: "check-sso", checkLoginIframe: false });

    // Global user info
    window.userType = keycloak.tokenParsed?.userType;

    // Only dipendenti have a sportello
    if (window.userType === "dipendente") {
      window.numeroSportello = Number(keycloak.tokenParsed?.Sportello);
      if (!window.numeroSportello) {
        alert("Errore: Sportello non trovato nel token Keycloak.");
      }
    }

    const btnLogin = document.querySelector(".btn-login");
    const btnLogout = document.querySelector(".btn-logout");

    if (window.userType) {
      if (btnLogout) btnLogout.style.display = "inline-block";
      if (btnLogin) btnLogin.style.display = "none";

      const currentPage = window.location.pathname.split("/").pop();
      if (currentPage === "utente.html") {
        if (window.userType === "dipendente") window.location.href = "dipendente.html";
        if (window.userType === "admin") window.location.href = "admin.html";
      }
    } else {
      if (btnLogin) btnLogin.style.display = "inline-block";
      if (btnLogout) btnLogout.style.display = "none";
    }

    if (btnLogin) {
      btnLogin.addEventListener("click", async () => {
        await keycloak.login();
      });
    }

    if (btnLogout) {
      btnLogout.addEventListener("click", () => {
        keycloak.logout({ redirectUri: window.location.origin + "/utente.html" });
      });
    }

  } catch (err) {
    console.error("Keycloak init failed:", err);
  }
});