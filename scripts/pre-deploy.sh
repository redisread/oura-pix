#!/bin/bash

# Pre-deploy script for Cloudflare Pages
# This script patches known issues in the OpenNext build output

echo "Running pre-deploy patches..."

# Fix: Replace `===-0` with `Object.is(..., -0)` to avoid esbuild warning
# This is a known issue in some JavaScript minifiers that generate `x === -0`
# which triggers esbuild's equals-negative-zero warning

HANDLER_FILE=".open-next/server-functions/default/handler.mjs"

if [ -f "$HANDLER_FILE" ]; then
    echo "Patching $HANDLER_FILE..."

    # Replace the problematic pattern: `x7===-0` with `Object.is(x7, -0)`
    # This fixes the esbuild warning: "Comparison with -0 using the === operator will also match 0"

    # Using sed with extended regex
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS requires -E for extended regex
        sed -i '' -E 's/([a-zA-Z0-9_]+)===-0/Object.is(\1, -0)/g' "$HANDLER_FILE"
    else
        # Linux
        sed -i -E 's/([a-zA-Z0-9_]+)===-0/Object.is(\1, -0)/g' "$HANDLER_FILE"
    fi

    echo "Patch applied successfully!"
else
    echo "Warning: $HANDLER_FILE not found, skipping patch."
fi

echo "Pre-deploy patches completed."