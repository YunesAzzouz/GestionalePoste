const keycloak = new Keycloak({
  url: "http://localhost:8080",
  realm: "PosteApp",
  clientId: "poste-frontend"
});

document.addEventListener("DOMContentLoaded", () => {
  const btnLogin = document.querySelector('.btn-login');
  const btnLogout = document.querySelector('.btn-logout');

  keycloak.init({ onLoad: 'check-sso' }).then(authenticated => {

    if (authenticated) {
      btnLogin.style.display = 'none';
      btnLogout.style.display = 'inline-block';

      btnLogout.addEventListener('click', () => {
        keycloak.logout({ redirectUri: window.location.origin + '/utente.html' });
      });

    } else {
      btnLogin.style.display = 'inline-block';
      btnLogout.style.display = 'none';

      btnLogin.addEventListener('click', () => {
        keycloak.login({ redirectUri: window.location.origin + '/dipendente.html' });
      });
    }

  }).catch(err => {
    console.error('Keycloak init failed', err);

    btnLogin.style.display = 'inline-block';
    btnLogout.style.display = 'none';
  });
});
