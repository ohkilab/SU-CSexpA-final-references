FROM mariadb:latest

COPY ./csv /tmp/csv

COPY ./db/init.sql /docker-entrypoint-initdb.d
