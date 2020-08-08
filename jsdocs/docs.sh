#!/usr/bin/env bash
# Simple shim to generate docs, also available as `npm run docs`.
# Exists since && is unixy so combining both commands via package.json won't
# work on windows.  Plus it's nice to clean up once in a while.

# Clean up old files
cd "$(git rev-parse --show-toplevel)/docs/" 2>/dev/null && rm -r ./* 2>/dev/null

echo 'Generating html documentation...'
npm run --silent ghpages
echo 'Generating markdown documentation...'
npm run --silent wiki
