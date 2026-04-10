#!/usr/bin/env bash
set -euo pipefail
npm install
npm run build
node server/index.js
