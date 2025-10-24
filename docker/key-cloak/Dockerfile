# Usa l'immagine ufficiale di Keycloak
FROM quay.io/keycloak/keycloak:latest

# Crea una directory temporanea per l'importazione
USER root
RUN mkdir -p /opt/keycloak/data/import

# Copia il file di esportazione del realm
COPY realm-export.json /opt/keycloak/data/import/

# Imposta le variabili d'ambiente
ENV KC_DB=dev-file
ENV KC_HTTP_ENABLED=true
ENV KC_LOG_LEVEL=INFO

# Variabile d'ambiente per l'utente amministratore iniziale di Keycloak
ENV KEYCLOAK_ADMIN=admin
ENV KEYCLOAK_ADMIN_PASSWORD=admin

# AGGIUNTA DI --hostname-strict=false come richiesto dal log di errore
ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "start", "--import-realm", "--hostname-strict=false"]

# Espone la porta di default di Keycloak
EXPOSE 8080