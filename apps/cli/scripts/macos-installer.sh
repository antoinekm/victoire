#!/bin/bash

# Pierre CLI macOS installer
# This script packages the Pierre CLI executable as a macOS .pkg installer

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BIN_DIR="$ROOT_DIR/bin"
BUILD_DIR="$ROOT_DIR/bin/macos-pkg"
INSTALL_DIR="/usr/local/bin"
APP_NAME="pierre"
PKG_IDENTIFIER="com.pierre.cli"
VERSION=$(grep '"version"' "$ROOT_DIR/package.json" | cut -d'"' -f4)

# Check requirements
command -v pkgbuild >/dev/null 2>&1 || { echo "pkgbuild is required. Please install Xcode command line tools."; exit 1; }

# Create build directory
mkdir -p "$BUILD_DIR/flat/root$INSTALL_DIR"
mkdir -p "$BUILD_DIR/flat/Resources"
mkdir -p "$BUILD_DIR/flat/scripts"

# Copy executable
cp "$BIN_DIR/pierre-mac" "$BUILD_DIR/flat/root$INSTALL_DIR/$APP_NAME"
chmod +x "$BUILD_DIR/flat/root$INSTALL_DIR/$APP_NAME"

# Create postinstall script
cat > "$BUILD_DIR/flat/scripts/postinstall" << EOF
#!/bin/bash
chmod 755 "$INSTALL_DIR/$APP_NAME"
EOF
chmod +x "$BUILD_DIR/flat/scripts/postinstall"

# Create Distribution XML
cat > "$BUILD_DIR/flat/Distribution" << EOF
<?xml version="1.0" encoding="utf-8"?>
<installer-gui-script minSpecVersion="1">
    <title>Pierre CLI</title>
    <organization>Pierre</organization>
    <domains enable_localSystem="true"/>
    <options customize="never" require-scripts="true" rootVolumeOnly="true" />
    <pkg-ref id="$PKG_IDENTIFIER"/>
    <choices-outline>
        <line choice="default">
            <line choice="$PKG_IDENTIFIER"/>
        </line>
    </choices-outline>
    <choice id="default"/>
    <choice id="$PKG_IDENTIFIER" visible="false">
        <pkg-ref id="$PKG_IDENTIFIER"/>
    </choice>
    <pkg-ref id="$PKG_IDENTIFIER" version="$VERSION" onConclusion="none">pierre-cli.pkg</pkg-ref>
</installer-gui-script>
EOF

# Create component package
pkgbuild --root "$BUILD_DIR/flat/root" \
         --scripts "$BUILD_DIR/flat/scripts" \
         --identifier "$PKG_IDENTIFIER" \
         --version "$VERSION" \
         --install-location "/" \
         "$BUILD_DIR/pierre-cli.pkg"

# Create product archive
productbuild --distribution "$BUILD_DIR/flat/Distribution" \
             --package-path "$BUILD_DIR" \
             --resources "$BUILD_DIR/flat/Resources" \
             "$BIN_DIR/installer/pierre-cli-$VERSION.pkg"

echo "macOS installer package created at $BIN_DIR/installer/pierre-cli-$VERSION.pkg"