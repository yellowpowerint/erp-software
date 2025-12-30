#!/bin/bash
cd /var/www/mining-erp/dev/backend
source .env
psql "$DATABASE_URL" -Atc "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('task_attachments', 'incident_attachments', 'expense_attachments') ORDER BY table_name;"
