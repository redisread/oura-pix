#!/bin/bash

# 开发环境测试脚本
# 验证 initOpenNextCloudflareForDev 改造是否成功

set -e

echo "=========================================="
echo "开发环境测试脚本"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试结果
TESTS_PASSED=0
TESTS_FAILED=0

# 辅助函数
print_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((TESTS_PASSED++))
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    ((TESTS_FAILED++))
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# 测试 1: 检查必要文件是否存在
echo "测试 1: 检查必要文件..."
if [ -f "lib/dev-init.ts" ]; then
    print_success "lib/dev-init.ts 存在"
else
    print_error "lib/dev-init.ts 不存在"
fi

if [ -f "lib/with-dev-init.ts" ]; then
    print_success "lib/with-dev-init.ts 存在"
else
    print_error "lib/with-dev-init.ts 不存在"
fi

if [ -f "lib/init-global.ts" ]; then
    print_success "lib/init-global.ts 存在"
else
    print_error "lib/init-global.ts 不存在"
fi

if [ -f "instrumentation.ts" ]; then
    print_success "instrumentation.ts 存在"
else
    print_error "instrumentation.ts 不存在"
fi

echo ""

# 测试 2: 检查是否移除了 wrangler external
echo "测试 2: 检查 next.config.js..."
if grep -q "wrangler" next.config.js; then
    print_error "next.config.js 仍包含 wrangler external"
else
    print_success "next.config.js 已移除 wrangler external"
fi

echo ""

# 测试 3: 检查 API routes 是否使用 withDevInit
echo "测试 3: 检查 API routes..."
if grep -q "withDevInit" app/api/auth/\[...all\]/route.ts; then
    print_success "auth route 使用 withDevInit"
else
    print_error "auth route 未使用 withDevInit"
fi

if grep -q "withDevInit" app/api/generations/route.ts; then
    print_success "generations route 使用 withDevInit"
else
    print_error "generations route 未使用 withDevInit"
fi

echo ""

# 测试 4: 检查认证配置是否修复
echo "测试 4: 检查认证配置..."
if grep -q "window.location.origin" lib/auth-client.ts; then
    print_success "auth-client.ts 使用动态 baseURL"
else
    print_error "auth-client.ts 未使用动态 baseURL"
fi

if grep -q "dynamically constructed" lib/auth.ts || grep -q "动态构建" lib/auth.ts; then
    print_success "auth.ts 使用动态 trustedOrigins"
else
    # 检查是否移除了硬编码
    if ! grep -q 'trustedOrigins: \[baseUrl, "http://localhost:4001"\]' lib/auth.ts; then
        print_success "auth.ts 已移除硬编码 trustedOrigins"
    else
        print_error "auth.ts 仍包含硬编码 trustedOrigins"
    fi
fi

echo ""

# 测试 5: 启动开发服务器并测试
echo "测试 5: 启动开发服务器..."
print_info "清理缓存..."
rm -rf .next .wrangler/state 2>/dev/null || true

print_info "启动服务器(后台运行)..."
npm run dev > /tmp/test-dev-server.log 2>&1 &
SERVER_PID=$!

# 等待服务器启动
print_info "等待服务器启动..."
sleep 15

# 检查服务器是否启动成功
if ps -p $SERVER_PID > /dev/null; then
    print_success "服务器启动成功 (PID: $SERVER_PID)"

    # 检查日志中是否包含初始化信息
    if grep -q "OpenNext Cloudflare dev environment initialized" /tmp/test-dev-server.log; then
        print_success "开发环境初始化成功"
    else
        print_error "未找到初始化日志"
    fi

    # 测试 API 端点
    print_info "测试 API 端点..."
    sleep 2

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4001/api/auth/get-session)
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "API 端点响应正常 (HTTP $HTTP_CODE)"
    else
        print_error "API 端点响应异常 (HTTP $HTTP_CODE)"
    fi

    # 停止服务器
    print_info "停止服务器..."
    kill $SERVER_PID 2>/dev/null || true
    sleep 2
    # 确保清理
    pkill -f "next dev" 2>/dev/null || true
else
    print_error "服务器启动失败"
    cat /tmp/test-dev-server.log
fi

echo ""

# 测试总结
echo "=========================================="
echo "测试总结"
echo "=========================================="
echo -e "${GREEN}通过: $TESTS_PASSED${NC}"
echo -e "${RED}失败: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过!${NC}"
    exit 0
else
    echo -e "${RED}✗ 部分测试失败,请检查上述错误${NC}"
    exit 1
fi
