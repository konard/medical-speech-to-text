#!/usr/bin/env bash
# check-mjs-syntax.sh
#
# Checks tracked JavaScript, including nested scripts, tests and native adapters.
#
# Usage:
#   bash scripts/check-mjs-syntax.sh
#
# Exit code 0 = all files pass syntax check; non-zero = syntax error found.

set -euo pipefail

node "$(dirname "$0")/check-javascript-syntax.mjs"
