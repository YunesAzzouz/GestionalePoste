FROM quay.io/keycloak/keycloak:26.0

ENV KEYCLOAK_ADMIN=admin
ENV KEYCLOAK_ADMIN_PASSWORD=admin

COPY realm-export.json /opt/keycloak/data/import/realm-export.json

# Import realm file automatically at startup
ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "start-dev", "--import-realm"]