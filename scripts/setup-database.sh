d#!/bin/bash
# Database Setup Script
# Usage: bash setup-database.sh <password>

DB_PASSWORD="$1"

if [ -z "$DB_PASSWORD" ]; then
    echo "Error: Password required"
    exit 1
fi

echo "Creating database and user..."

sudo -u postgres psql <<EOF
CREATE DATABASE mining_erp_db;
CREATE USER mining_erp_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE mining_erp_db TO mining_erp_user;
\c mining_erp_db
GRANT ALL ON SCHEMA public TO mining_erp_user;
EOF

echo "Database setup completed!"
