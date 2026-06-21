#!/bin/bash
set -e

# Change directory to the repository root
cd "$(dirname "$0")/.."

# Clean up any existing docs folder
rm -rf docs
mkdir -p docs

# Locate mkdocs executable
MKDOCS_BIN="mkdocs"
if [ -f ".venv/bin/mkdocs" ]; then
    MKDOCS_BIN=".venv/bin/mkdocs"
fi

# Determine command
CMD=$1
if [ -z "$CMD" ]; then
    CMD="build"
fi

# Create files inside docs
if [ "$CMD" = "serve" ]; then
    # Create symlinks so live-reload works
    ln -sf ../README.md docs/index.md
    ln -sf ../SPECIFICATION.md docs/SPECIFICATION.md
    ln -sf ../CONTRIBUTING.md docs/CONTRIBUTING.md
    ln -sf ../ADOPTERS.md docs/ADOPTERS.md
    ln -sf ../migration_guide.md docs/migration_guide.md
    ln -sf ../specification docs/specification
    ln -sf ../schemas docs/schemas
    ln -sf ../test-suite docs/test-suite
    
    echo "Starting local docs server..."
    $MKDOCS_BIN serve
else
    # For build and deploy, copying is safer and more portable
    cp README.md docs/index.md
    cp SPECIFICATION.md docs/
    cp CONTRIBUTING.md docs/
    cp ADOPTERS.md docs/
    cp migration_guide.md docs/
    cp -r specification docs/
    cp -r schemas docs/
    cp -r test-suite docs/
    
    if [ "$CMD" = "gh-deploy" ]; then
        $MKDOCS_BIN gh-deploy --force
    else
        $MKDOCS_BIN build
    fi
    
    # Clean up docs folder
    rm -rf docs
fi
