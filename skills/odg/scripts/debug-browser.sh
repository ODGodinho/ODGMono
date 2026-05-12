#!/usr/bin/env bash
# Diretório deste arquivo: em zsh com `source`, BASH_SOURCE costuma estar vazio e vira cwd.
if [ -n "${ZSH_VERSION:-}" ]; then
  eval 'SCRIPT_DIR="${0:A:h}"'
elif [ -n "${BASH_SOURCE[0]:-}" ]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
else
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
fi

if [ -n "${1:-}" ]; then
  export CLI_CONFIG_PATH="$1"
else
  export CLI_CONFIG_PATH="${SCRIPT_DIR}/../configs/playwright-cli.config.json"
fi

export CLI_CDP_PORT=$(grep '"cdpPort":' "$CLI_CONFIG_PATH" | sed 's/[^0-9]//g')
playwright-cli open --config "$CLI_CONFIG_PATH" --headed > /dev/null 2>&1
export CLI_BROWSER_CONNECT_WS=$(curl -s "http://localhost:$CLI_CDP_PORT/json/version" | grep '"webSocketDebuggerUrl"' | awk -F '"' '{print $4}')
echo "$CLI_BROWSER_CONNECT_WS"