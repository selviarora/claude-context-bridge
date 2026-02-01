#!/bin/bash

# Wrapper script for Chrome native messaging
# Chrome doesn't inherit shell PATH, so we need to set up Node path

# Try common Node locations
if [ -x "$HOME/.nvm/versions/node/v20.19.1/bin/node" ]; then
  NODE="$HOME/.nvm/versions/node/v20.19.1/bin/node"
elif [ -x "/usr/local/bin/node" ]; then
  NODE="/usr/local/bin/node"
elif [ -x "/opt/homebrew/bin/node" ]; then
  NODE="/opt/homebrew/bin/node"
else
  # Try to find it
  NODE=$(which node 2>/dev/null || echo "/usr/local/bin/node")
fi

DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$NODE" "$DIR/host.js"
