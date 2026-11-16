#!/usr/bin/env bash
set -euo pipefail
REPO_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${ELLM_INSTALL_DIR:-$HOME/.local/share/ellm-proxy}"
BIN_DIR="${ELLM_BIN_DIR:-$HOME/.local/bin}"
if ! command -v node >/dev/null 2>&1; then echo "Node.js 22 or newer is required." >&2; exit 1; fi
node_major="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$node_major" -lt 22 ]; then echo "Node.js 22 or newer is required (found $(node --version))." >&2; exit 1; fi
mkdir -p "$INSTALL_DIR" "$BIN_DIR"
cp -R "$REPO_DIR/bin" "$REPO_DIR/dist" "$REPO_DIR/docs" "$REPO_DIR/ellm.config.example.json" "$REPO_DIR/package.json" "$REPO_DIR/README.md" "$REPO_DIR/LICENSE" "$INSTALL_DIR/"
ln -sfn "$INSTALL_DIR/bin/ellm-proxy.js" "$BIN_DIR/ellm-proxy"
CONFIG_DIR="${ELLM_CONFIG_DIR:-$HOME/.ellm-proxy}"
mkdir -p "$CONFIG_DIR"
if [ ! -e "$CONFIG_DIR/ellm.config.json" ]; then cp "$REPO_DIR/ellm.config.example.json" "$CONFIG_DIR/ellm.config.json"; chmod 600 "$CONFIG_DIR/ellm.config.json"; fi
echo "Installed ellm-proxy to $INSTALL_DIR"
echo "Command: $BIN_DIR/ellm-proxy"
echo "Config (local and untracked): $CONFIG_DIR/ellm.config.json"
