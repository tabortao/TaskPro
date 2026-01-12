#!/bin/bash

scan_result=$(ast-grep scan --rule .rules/navigateTo.yml)

# If no scan results, exit early
if [ -z "$scan_result" ]; then
    exit 0
fi

echo "📋 Reading src/app.config.ts content:"
cat src/app.config.ts

echo ""
echo ""
echo "🔍 Scanning for navigateTo usage:"
echo "$scan_result"
echo ""
echo ""

echo "⚠️  IMPORTANT: Please review the app.config.ts file above!"
echo ""
echo "📌 Key Points:"
echo "• The tabBar.list contains tab page paths (e.g., 'pages/home/index')"
echo "• These are TAB pages, not regular navigation pages"
echo ""
echo "🚫 INCORRECT:"
echo "• Using Taro.navigateTo() or navigateTo() to jump to tab paths is WRONG"
echo "• navigateTo() should NOT be used for pages defined in tabBar.list"
echo ""
echo "✅ CORRECT:"
echo "• Use Taro.switchTab() to navigate to tab pages"
echo "• Only use navigateTo() for non-tab pages"
echo ""
echo "🔧 ACTION REQUIRED:"
echo "If the scan above shows navigateTo() calls with tab paths, please:"
echo "1. Replace navigateTo() with switchTab() for tab pages"
echo "2. Ensure the url parameter only contains the page path (no query parameters)"
echo "Example: Taro.switchTab({ url: '/pages/home/index' })"
echo "========================================"

exit 1
