#!/usr/bin/env bash
# SessionStart hook - fx.jam
# Injecte l index memoire + 30 dernieres lignes du journal dans le contexte.
# Sort toujours en 0 pour ne jamais bloquer le demarrage d une session.
set -uo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"
INDEX_FILE="$PROJECT_DIR/.claude/memory-index.md"
LOG_FILE="$PROJECT_DIR/CLAUDE_LOG.md"

context=""

if [[ -f "$INDEX_FILE" ]]; then
  context+="## Index memoire du projet"$'\n\n'
  context+="$(cat "$INDEX_FILE")"
  context+=$'\n\n'
fi

if [[ -f "$LOG_FILE" ]]; then
  context+="## CLAUDE_LOG.md - 30 dernieres lignes (plus recent en haut)"$'\n\n'
  context+=$'```\n'
  context+="$(head -n 30 "$LOG_FILE")"
  context+=$'\n```\n'
  context+=$'\n(Journal complet dans CLAUDE_LOG.md a la racine.)\n'
fi

[[ -z "$context" ]] && exit 0

if command -v jq >/dev/null 2>&1; then
  jq -n --arg ctx "$context" \
    '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":$ctx}}'
else
  python3 -c "
import json, sys
ctx = sys.argv[1]
out = {'hookSpecificOutput': {'hookEventName': 'SessionStart', 'additionalContext': ctx}}
print(json.dumps(out))
" "$context"
fi

exit 0
