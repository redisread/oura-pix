#!/usr/bin/env node
/**
 * 本地调试环境检查脚本
 * 检查必要的配置文件是否存在并有效
 */

const { existsSync, readFileSync } = require('fs');
const { resolve } = require('path');

const rootDir = resolve(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPath(filePath, description) {
  const fullPath = resolve(rootDir, filePath);
  const exists = existsSync(fullPath);

  if (exists) {
    log(`✓ ${description}: ${filePath}`, 'green');
  } else {
    log(`✗ ${description}: ${filePath} (不存在)`, 'red');
  }

  return exists;
}

function checkRequiredKeys(filePath, keys, description) {
  const fullPath = resolve(rootDir, filePath);
  if (!existsSync(fullPath)) return false;

  const content = readFileSync(fullPath, 'utf-8');
  const missingKeys = keys.filter((key) => !new RegExp(`^${key}=`, 'm').test(content));

  if (missingKeys.length === 0) {
    log(`✓ ${description}: 必需键已配置`, 'green');
    return true;
  }

  log(`✗ ${description}: 缺少 ${missingKeys.join(', ')}`, 'red');
  return false;
}

function checkWranglerConfig(filePath, options = {}) {
  const fullPath = resolve(rootDir, filePath);
  if (!existsSync(fullPath)) {
    log(`✗ Wrangler 配置: ${filePath} (不存在)`, 'red');
    return false;
  }

  try {
    const content = readFileSync(fullPath, 'utf-8');
    const hasD1 = content.includes('d1_databases');
    const hasR2 = content.includes('r2_buckets');
    const hasAssets = content.includes('[assets]');

    log(`✓ Wrangler 配置: ${filePath}`, 'green');
    if (options.expectD1 && hasD1) log('  - D1 数据库绑定已配置', 'green');
    if (options.expectR2 && hasR2) log('  - R2 存储绑定已配置', 'green');
    if (options.expectAssets && hasAssets) log('  - 静态资源绑定已配置', 'green');

    if (options.expectD1 && !hasD1) return false;
    if (options.expectR2 && !hasR2) return false;
    if (options.expectAssets && !hasAssets) return false;

    return true;
  } catch (e) {
    log(`✗ Wrangler 配置: ${filePath} (读取失败)`, 'red');
    return false;
  }
}

function main() {
  log('\n========================================', 'cyan');
  log('  OuraPix 本地调试环境检查', 'cyan');
  log('========================================\n', 'cyan');

  let allGood = true;

  // 检查 API 配置
  log('【API Worker 配置】', 'yellow');
  allGood = checkWranglerConfig('api/wrangler.jsonc', { expectD1: true, expectR2: true }) && allGood;
  allGood = checkPath('api/.dev.vars', 'API Secrets 文件') && allGood;
  allGood = checkPath('api/.dev.vars.example', 'API Secrets 模板') && allGood;
  allGood = checkRequiredKeys('api/.dev.vars', [
    'BETTER_AUTH_SECRET',
    'BETTER_AUTH_URL',
    'NEXT_PUBLIC_APP_URL',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'GEMINI_API_KEY',
  ], 'API Secrets 文件') && allGood;

  log('');

  // 检查 Web 配置
  log('【Web 应用配置】', 'yellow');
  allGood = checkWranglerConfig('frontend/wrangler.toml', { expectAssets: true }) && allGood;
  allGood = checkPath('frontend/.env.local', 'Web 环境变量') && allGood;
  allGood = checkPath('frontend/.env.local.example', 'Web 环境变量模板') && allGood;
  allGood = checkRequiredKeys('frontend/.env.local', ['PUBLIC_API_URL'], 'Web 环境变量') && allGood;

  log('');

  // 检查数据库配置
  log('【数据库配置】', 'yellow');
  const hasMigrations = checkPath('drizzle/migrations', '迁移目录');
  if (hasMigrations) {
    const migrationsPath = resolve(rootDir, 'drizzle/migrations');
    const migrations = existsSync(migrationsPath);
    if (migrations) {
      log('  - 迁移目录存在，记得运行 pnpm db:migrate:local', 'yellow');
    }
  }

  log('');

  // 检查自动化入口
  log('【本地测试命令】', 'yellow');
  allGood = checkPath('package.json', '根 package.json') && allGood;
  allGood = checkPath('pnpm-lock.yaml', '锁文件') && allGood;

  log('');

  // 总结
  log('========================================', 'cyan');
  if (allGood) {
    log('✓ 所有必要配置已就绪！', 'green');
    log('\n快速开始：', 'cyan');
    log('  1. pnpm db:migrate:local    # 初始化数据库', 'cyan');
    log('  2. pnpm api:dev             # 启动 API Worker: http://localhost:8989', 'cyan');
    log('  3. pnpm web:dev             # 启动 Web 应用: http://localhost:4321', 'cyan');
    log('  4. pnpm verify              # 运行 lint/typecheck/test/build 门禁', 'cyan');
    log('\n或使用组合命令：', 'cyan');
    log('  pnpm debug:full             # 迁移数据库并启动所有服务', 'cyan');
  } else {
    log('✗ 部分配置缺失，请参考 docs/LOCAL_TESTING.md', 'red');
    log('\n快速修复：', 'yellow');
    log('  cp api/.dev.vars.example api/.dev.vars', 'yellow');
    log('  cp frontend/.env.local.example frontend/.env.local', 'yellow');
    log('  # 然后编辑这两个文件填入你的配置', 'yellow');
  }
  log('========================================\n', 'cyan');

  process.exit(allGood ? 0 : 1);
}

main();
