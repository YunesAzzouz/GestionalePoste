const keycloak = new Keycloak({
  url: "http://localhost:8080",
  realm: "PosteApp",
  clientId: "poste-frontend"
});

document.addEventListener("DOMContentLoaded", () => {
  const btnLogin = document.querySelector('.btn-login');
  const btnLogout = document.querySelector('.btn-logout');

  // Initialize Keycloak
  keycloak.init({ onLoad: 'check-sso' }).then(authenticated => {

    if (authenticated) {
      // User is logged in
      btnLogin.style.display = 'none';
      btnLogout.style.display = 'inline-block';

      // Redirect automatically if you are on utente.html
      if (window.location.pathname.endsWith('/utente.html')) {
        window.location.href = 'dipendente.html';
      }

      // Logout button listener
      btnLogout.addEventListener('click', () => {
        keycloak.logout({
          redirectUri: window.location.origin + '/utente.html'
        });
      });

    } else {
      // User not logged in
      btnLogin.style.display = 'inline-block';
      btnLogout.style.display = 'none';

      btnLogin.addEventListener('click', () => {
        keycloak.login({
          redirectUri: window.location.origin + '/dipendente.html'
        });
      });
    }

  }).catch(err => {
    console.error('Keycloak init failed', err);
  });
});
