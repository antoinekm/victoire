#!/bin/bash

# Pierre CLI Linux installer script
# Generates DEB and RPM packages

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BIN_DIR="$ROOT_DIR/bin"
BUILD_DIR="$ROOT_DIR/bin/linux-pkg"
APP_NAME="pierre"
VERSION=$(grep '"version"' "$ROOT_DIR/package.json" | cut -d'"' -f4)

# Check for required tools
command -v fpm >/dev/null 2>&1 || { 
  echo "fpm is required. Please install with: gem install fpm"; 
  echo "You might need to install dependencies: apt-get install ruby ruby-dev rubygems build-essential rpm"; 
  exit 1; 
}

# Create build directories
mkdir -p "$BUILD_DIR/bin"
mkdir -p "$BUILD_DIR/installer"

# Copy binary
cp "$BIN_DIR/pierre-linux" "$BUILD_DIR/bin/$APP_NAME"
chmod +x "$BUILD_DIR/bin/$APP_NAME"

# Create DEB package
echo "Creating DEB package..."
fpm -s dir -t deb -n "$APP_NAME-cli" -v "$VERSION" \
    --description "Pierre AI Desktop Assistant CLI" \
    --url "https://pierre.example.com" \
    --maintainer "support@pierre.example.com" \
    --vendor "Pierre" \
    --license "Proprietary" \
    --deb-no-default-config-files \
    --after-install "$SCRIPT_DIR/linux-postinstall.sh" \
    --after-remove "$SCRIPT_DIR/linux-postrm.sh" \
    -p "$BIN_DIR/installer/${APP_NAME}-cli_${VERSION}_amd64.deb" \
    "$BUILD_DIR/bin/$APP_NAME=/usr/bin/$APP_NAME"

# Create RPM package
echo "Creating RPM package..."
fpm -s dir -t rpm -n "$APP_NAME-cli" -v "$VERSION" \
    --description "Pierre AI Desktop Assistant CLI" \
    --url "https://pierre.example.com" \
    --maintainer "support@pierre.example.com" \
    --vendor "Pierre" \
    --license "Proprietary" \
    --after-install "$SCRIPT_DIR/linux-postinstall.sh" \
    --after-remove "$SCRIPT_DIR/linux-postrm.sh" \
    -p "$BIN_DIR/installer/${APP_NAME}-cli-${VERSION}.x86_64.rpm" \
    "$BUILD_DIR/bin/$APP_NAME=/usr/bin/$APP_NAME"

echo "Linux packages created at:"
echo "  - $BIN_DIR/installer/${APP_NAME}-cli_${VERSION}_amd64.deb"
echo "  - $BIN_DIR/installer/${APP_NAME}-cli-${VERSION}.x86_64.rpm"