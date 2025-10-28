document.addEventListener("DOMContentLoaded", async () => {
  const keycloak = new Keycloak({
    url: "http://localhost:8080", // must be accessible from the browser
    realm: "PosteApp",
    clientId: "poste-frontend"
  });

  const btnLogin = document.querySelector(".btn-login");
  const btnLogout = document.querySelector(".btn-logout");

  async function initKeycloak() {
    try {
      // Silent login check; does not force login
      const authenticated = await keycloak.init({
        onLoad: "check-sso",
        checkLoginIframe: false
      });

      if (authenticated && keycloak.tokenParsed) {
        const userType = keycloak.tokenParsed.userType; // only "dipendente" or "admin"
        window.userType = userType;

        // Show/hide buttons
        if (btnLogin) btnLogin.style.display = "none";
        if (btnLogout) btnLogout.style.display = "inline-block";

        // Redirect based on userType
        const currentPage = window.location.pathname.split("/").pop();

        if (currentPage === "utente.html") {
          if (userType === "admin") window.location.href = "admin.html";
          else if (userType === "dipendente") window.location.href = "dipendente.html";
          // Guest users (no token) stay on utente.html
        }

      } else {
        // Not logged in
        if (btnLogin) btnLogin.style.display = "inline-block";
        if (btnLogout) btnLogout.style.display = "none";
      }

    } catch (err) {
      console.error("Keycloak init failed:", err);
      alert("Keycloak initialization failed. Check console for details.");
    }
  }

  // Button actions
  if (btnLogin) btnLogin.addEventListener("click", () => {
    keycloak.login({
      redirectUri: window.location.origin + "/utente.html"
    });
  });

  if (btnLogout) btnLogout.addEventListener("click", () => {
    keycloak.logout({
      redirectUri: window.location.origin + "/utente.html"
    });
  });

  await initKeycloak();
});