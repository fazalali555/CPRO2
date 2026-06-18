#!/data/data/com.termux/files/usr/bin/bash

set -e

cd ~/CPRO2

echo "Installing enterprise upgrade..."

npx skills add vercel-labs/agent-skills --scope project -y \
--select vercel-react-best-practices,web-design-guidelines,vercel-composition-patterns || true

npx skills add anthropics/skills --scope project -y \
--select pdf,docx,frontend-design,markdown || true

npx skills add obra/superpowers --scope project -y \
--select systematic-debugging,writing-plans || true

npx skills add google/skills --scope project -y \
--select typescript,architecture,testing,api-design,security,refactoring,sql,performance || true

mkdir -p .ai
mkdir -p docs
mkdir -p tests

touch .ai/pension-rules.md
touch .ai/retirement-rules.md
touch .ai/gpf-rules.md
touch .ai/eef-rules.md
touch .ai/bf-rbdc-rules.md
touch .ai/payroll-rules.md
touch .ai/ta-bill-rules.md
touch .ai/budget-rules.md
touch .ai/office-letter-rules.md
touch .ai/kpk-service-rules.md

npm install \
zod \
drizzle-orm \
vitest \
playwright \
eslint \
prettier \
husky \
lint-staged \
typedoc \
ts-pattern \
neverthrow \
msw

pkg install -y python git || true

pip install aider-install || true
aider-install || true

npm install -g \
@modelcontextprotocol/server-filesystem \
@modelcontextprotocol/server-github || true

gemini skills reload || true

echo "Done"
