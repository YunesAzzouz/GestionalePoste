document.addEventListener("DOMContentLoaded", async () => {
  const keycloak = new Keycloak({
    url: "http://localhost:8080",
    realm: "PosteApp",
    clientId: "poste-frontend"
  });

  const btnLogin = document.querySelector(".btn-login");
  const btnLogout = document.querySelector(".btn-logout");
  const profileBox = document.querySelector(".profile"); 

  async function initKeycloak() {
    try {
      const authenticated = await keycloak.init({
        onLoad: "check-sso",
        checkLoginIframe: false
      });

      if (authenticated && keycloak.tokenParsed) {
        const userType = keycloak.tokenParsed.userType;
        window.userType = userType;

        if (btnLogin) btnLogin.style.display = "none";
        if (btnLogout) btnLogout.style.display = "inline-block";

        const res = await fetch("/api/utente-profile", {
          headers: { Authorization: `Bearer ${keycloak.token}` }
        });
        const profile = await res.json();
        console.log("User profile:", profile);

        if (profileBox) {
          profileBox.innerHTML = `
            <p><strong>Utente:</strong> ${profile.preferred_username || profile.email}</p>
            <p><strong>Email:</strong> ${profile.email || "n/a"}</p>
            <p><strong>Ruolo:</strong> ${userType || "utente"}</p>
          `;
        }

        const currentPage = window.location.pathname.split("/").pop();
        if (currentPage === "utente.html") {
          if (userType === "admin") window.location.href = "admin.html";
          else if (userType === "dipendente") window.location.href = "dipendente.html";
        }

      } else {
        if (btnLogin) btnLogin.style.display = "inline-block";
        if (btnLogout) btnLogout.style.display = "none";
        if (profileBox) profileBox.innerHTML = "<p>Non sei autenticato</p>";
      }

    } catch (err) {
      console.error("Keycloak init failed:", err);
    }
  }

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