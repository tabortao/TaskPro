#!/bin/bash

LINT_MODE=true npx taro build --type h5 > build-output.txt 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    # Filter out verbose build information and stack traces
    # Use tr to remove null bytes, then filter
    cat build-output.txt | \
    tr -d '\000' | \
    grep -v "at file://" | \
    grep -v "watchFiles:" | \
    grep -v "node_modules" | \
    grep -v "rollup" | \
    grep -v "'\\\x00" | \
    head -20
fi

rm -f build-output.txt

if [ $EXIT_CODE -eq 0 ]; then
    if [ -d "dist" ]; then
        rm -rf /workspace/.dist
        cp -r dist /workspace/.dist
    fi
fi

exit $EXIT_CODE
