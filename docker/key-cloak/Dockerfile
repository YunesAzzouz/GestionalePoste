FROM quay.io/keycloak/keycloak:latest

USER root
RUN mkdir -p /opt/keycloak/data/import

COPY realm-export.json /opt/keycloak/data/import/

ENV KC_DB=dev-file
ENV KC_HTTP_ENABLED=true
ENV KC_LOG_LEVEL=INFO

ENV KEYCLOAK_ADMIN=admin
ENV KEYCLOAK_ADMIN_PASSWORD=admin

ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "start", "--import-realm", "--hostname-strict=false"]

EXPOSE 8080