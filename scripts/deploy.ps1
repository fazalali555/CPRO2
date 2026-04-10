Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
npm install
npm run build
node server/index.js
