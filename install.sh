#!/usr/bin/env bash
set -euo pipefail
REPO_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${LIGHT_INSTALL_DIR:-$HOME/.local/share/light-proxy}"
BIN_DIR="${LIGHT_BIN_DIR:-$HOME/.local/bin}"
if ! command -v node >/dev/null 2>&1; then echo "Node.js 22 or newer is required." >&2; exit 1; fi
node_major="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$node_major" -lt 22 ]; then echo "Node.js 22 or newer is required (found $(node --version))." >&2; exit 1; fi
mkdir -p "$INSTALL_DIR" "$BIN_DIR"
cp -R "$REPO_DIR/bin" "$REPO_DIR/dist" "$REPO_DIR/docs" "$REPO_DIR/light.config.example.json" "$REPO_DIR/package.json" "$REPO_DIR/README.md" "$REPO_DIR/LICENSE" "$INSTALL_DIR/"
ln -sfn "$INSTALL_DIR/bin/light-proxy.js" "$BIN_DIR/light-proxy"
CONFIG_DIR="${LIGHT_CONFIG_DIR:-$HOME/.light-proxy}"
mkdir -p "$CONFIG_DIR"
if [ ! -e "$CONFIG_DIR/light.config.json" ]; then cp "$REPO_DIR/light.config.example.json" "$CONFIG_DIR/light.config.json"; chmod 600 "$CONFIG_DIR/light.config.json"; fi
echo "Installed light-proxy to $INSTALL_DIR"
echo "Command: $BIN_DIR/light-proxy"
echo "Config (local and untracked): $CONFIG_DIR/light.config.json"
