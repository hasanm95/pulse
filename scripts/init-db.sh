#!/bin/bash
set -e

# Notice NO QUOTES around EOSQL so variables expand
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<EOSQL
    CREATE DATABASE ${AUTH_DB_NAME};
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<EOSQL
    CREATE DATABASE ${MONITOR_CONFIG_DB_NAME};
EOSQL
