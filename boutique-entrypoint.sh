#!/bin/sh

if [ "$DEV_MODE" = "lite" ]; then
  echo "DEV_MODE is lite, running default command..."
  exec node ./packages/boutique/backend/dist/index.js
elif [ "$DEV_MODE" = "debug" ]; then
  echo "DEV_MODE is debug, running build with debug port $DEBUG_PORT open..."
  exec node --inspect=0.0.0.0:${DEBUG_PORT} ./packages/boutique/backend/dist/index.js
else
  echo "DEV_MODE is hot-reload, running dev command with nodemon watcher and rebuild..."
  exec pnpm boutique:backend dev
fi