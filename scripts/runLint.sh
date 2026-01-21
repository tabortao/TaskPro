#!/bin/bash

# 用于收集所有检查的退出码
EXIT_CODES=()

npx biome check --write --unsafe --diagnostic-level=error
EXIT_CODES+=($?)

npx tsgo -p tsconfig.check.json
EXIT_CODES+=($?)

./scripts/checkNavigation.sh
EXIT_CODES+=($?)

./scripts/checkIconPath.sh
EXIT_CODES+=($?)

ALL_PASSED=true
for code in "${EXIT_CODES[@]}"; do
    if [ $code -ne 0 ]; then
        ALL_PASSED=false
        break
    fi
done

if [ "$ALL_PASSED" = true ]; then
    echo ""
    ./scripts/testBuild.sh
    exit $?
else
    exit 1
fi
