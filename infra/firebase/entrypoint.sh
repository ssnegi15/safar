#!/bin/sh
set -eu

chown -R node:node /data
exec su node -s /bin/sh -c 'exec firebase emulators:start --only auth --project demo-safar --config /workspace/firebase.json --import /data --export-on-exit /data'
