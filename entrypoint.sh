#!/bin/sh
set -e

node scripts/migrate-db.js
exec node server.js
