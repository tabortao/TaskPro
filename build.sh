mkdir -p output

export PATH=::$PATH

echo "node: $(node -v)"
echo "npm: v$(npm -v)"

OUTPUT_DIR="./output"

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# 打包排除指定目录，然后解压到 output
tar --exclude='./node_modules' --exclude='./.git'  --exclude='./output' --exclude='./dist' --exclude='./ci.yml' --exclude='./swc' --exclude='./idea' --exclude="./vscode" -cf - . | tar -C "$OUTPUT_DIR" -xf -

cd output
# 1. 初始化 git 仓库
git init

# 2. 设置用户信息
git config user.name "miaoda"
git config user.email "miaoda@baidu.com"

echo ".sync" >> .gitignore
echo "history/*.json" >> .gitignore
echo ".vite_cache" >> .gitignore

# 3. 创建 post-commit hook
mkdir -p .git/hooks
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash

# Get commit information
COMMIT_HASH=$(git rev-parse HEAD)
COMMIT_MESSAGE=$(git log -1 --pretty=%B)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
APP_ID=$(basename "$(pwd)")

# Check if commit message contains "no sync" (case insensitive)
if echo "$COMMIT_MESSAGE" | grep -iq "no sync"; then
    echo "Skipping sync signal creation due to 'no sync' in commit message"
    exit 0
fi

# Create .sync directory if it doesn't exist
mkdir -p .sync

# Create signal file
SIGNAL_FILE=".sync/signal_${COMMIT_HASH}.json"

# Create JSON content with proper escaping
python3 << PYTHON_EOF > "$SIGNAL_FILE"
import json
import sys

data = {
    "commit_id": "$COMMIT_HASH",
    "commit_message": """$COMMIT_MESSAGE""",
    "timestamp": "$TIMESTAMP",
    "app_id": "$APP_ID"
}

print(json.dumps(data, indent=2, ensure_ascii=False))
PYTHON_EOF

EOF

# 4. 设置 hook 为可执行
chmod +x .git/hooks/post-commit

# 5. 添加所有文件到暂存区
git add .

git commit -m "Initial miaoda project setup with Taro weapp template $AGILE_REVISION"

rm -rf .sync

echo "build end"
