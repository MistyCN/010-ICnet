#!/bin/sh
set -e

if [ "$(id -u)" = "0" ]; then
  mkdir -p /app/data/uploads
  chown -R nextjs:nodejs /app/data
  exec su -s /bin/sh nextjs -c "node scripts/migrate-db.js && exec node server.js"
fi

node scripts/migrate-db.js
exec node server.js
