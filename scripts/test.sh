#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
exec node --experimental-strip-types --import ./scripts/test-loader.mjs --test $(find src -name '*.test.ts' | sort)
