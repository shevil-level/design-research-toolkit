#!/bin/bash
set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════${NC}"
echo -e "${BOLD}${CYAN}  Level AI — Cursor Toolkit Setup${NC}"
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════${NC}"
echo ""

# ── Step 0: Check Node.js ──
echo -e "${BOLD}[1/4] Checking prerequisites...${NC}"
if ! command -v node &> /dev/null; then
  echo -e "${RED}Node.js is not installed. Please install Node.js v18+ from https://nodejs.org/${NC}"
  exit 1
fi

NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo -e "${RED}Node.js v18+ is required (found $(node -v)). Please upgrade.${NC}"
  exit 1
fi
echo -e "  ${GREEN}✓${NC} Node.js $(node -v) detected"
echo ""

# ── Step 1: Create .env from .env.example ──
echo -e "${BOLD}[2/4] Setting up environment...${NC}"
if [ -f "$PROJECT_ROOT/.env" ]; then
  echo -e "  ${YELLOW}⚠${NC} .env already exists — skipping copy."
  echo -e "  ${YELLOW}  (Delete it and re-run setup to start fresh)${NC}"
else
  cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
  echo -e "  ${GREEN}✓${NC} Created .env from .env.example"
fi
echo ""

# ── Step 2: Collect credentials ──
echo -e "${BOLD}[3/4] Configuring credentials...${NC}"
echo ""

echo -e "  ${CYAN}── Gong API ──${NC}"
echo -e "  Get credentials from: Gong → Company Settings → API → Generate credentials"
echo -e "  (If you don't have access, ask Shevil on Slack)"
echo ""
read -rp "  Gong Access Key: " GONG_KEY
read -rp "  Gong Access Secret: " GONG_SECRET
echo ""

echo -e "  ${CYAN}── Metabase ──${NC}"
echo -e "  Use the same email/password you use to log into Metabase."
echo ""
read -rp "  Metabase Username (email): " MB_USER
read -rsp "  Metabase Password: " MB_PASS
echo ""
echo ""

# Write credentials to .env
cat > "$PROJECT_ROOT/.env" << EOF
# ── Level AI Cursor Toolkit — Credentials ──
# Copy this file to .env and fill in your credentials, then restart Cursor.

# Gong API (required for Gong MCP)
# Get yours from: Gong → Settings → API → Generate credentials
GONG_ACCESS_KEY=${GONG_KEY}
GONG_ACCESS_SECRET=${GONG_SECRET}

# Metabase (required for Metabase MCP)
# Use your Level AI Metabase login
METABASE_USERNAME=${MB_USER}
METABASE_PASSWORD=${MB_PASS}
EOF

# Update mcp.json with Metabase credentials
MCP_JSON="$PROJECT_ROOT/.cursor/mcp.json"
if [ -f "$MCP_JSON" ]; then
  node -e "
    const fs = require('fs');
    const cfg = JSON.parse(fs.readFileSync('$MCP_JSON', 'utf8'));
    if (cfg.mcpServers && cfg.mcpServers.metabase && cfg.mcpServers.metabase.env) {
      cfg.mcpServers.metabase.env.METABASE_USERNAME = '$MB_USER';
      cfg.mcpServers.metabase.env.METABASE_PASSWORD = '$MB_PASS';
      fs.writeFileSync('$MCP_JSON', JSON.stringify(cfg, null, 2) + '\n');
    }
  "
  echo -e "  ${GREEN}✓${NC} Credentials saved to .env and .cursor/mcp.json"
else
  echo -e "  ${GREEN}✓${NC} Credentials saved to .env"
fi
echo ""

# ── Step 3: Install and build Gong MCP server ──
echo -e "${BOLD}[4/4] Installing Gong MCP server...${NC}"
cd "$PROJECT_ROOT/gong-mcp-server"
npm install --silent 2>&1 | tail -1
echo -e "  ${GREEN}✓${NC} Dependencies installed"

npm run build --silent 2>&1
echo -e "  ${GREEN}✓${NC} Gong MCP server built"
cd "$PROJECT_ROOT"
echo ""

# ── Done ──
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${BOLD}${GREEN}  Setup complete!${NC}"
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BOLD}Next steps:${NC}"
echo -e "  1. Open Cursor → Settings → MCP"
echo -e "  2. Enable the ${BOLD}gong${NC}, ${BOLD}metabase${NC}, and ${BOLD}mixpanel${NC} servers (toggle them on)"
echo -e "  3. Restart Cursor (Cmd+Shift+P → \"Reload Window\")"
echo ""
echo -e "  Once you see ${GREEN}green dots${NC} next to each MCP server, you're ready!"
echo -e "  Try: ${CYAN}\"What are customers saying about scorecard exports?\"${NC}"
echo ""
