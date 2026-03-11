#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  source "$SCRIPT_DIR/.env"
  set +a
fi

export METABASE_URL="${METABASE_URL:-http://10.138.0.68:3000}"
exec npx -y @cognitionai/metabase-mcp-server
