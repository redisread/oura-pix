#!/usr/bin/env node
/**
 * 本地调试环境检查脚本
 * 检查必要的配置文件是否存在并有效
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
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

function checkFile(filePath, description) {
  const fullPath = resolve(rootDir, filePath);
  const exists = existsSync(fullPath);

  if (exists) {
    log(`✓ ${description}: ${filePath}`, 'green');
  } else {
    log(`✗ ${description}: ${filePath} (不存在)`, 'red');
  }

  return exists;
}

function checkWranglerConfig(filePath) {
  const fullPath = resolve(rootDir, filePath);
  if (!existsSync(fullPath)) {
    log(`✗ Wrangler 配置: ${filePath} (不存在)`, 'red');
    return false;
  }

  try {
    const content = readFileSync(fullPath, 'utf-8');
    const hasD1 = content.includes('d1_databases');
    const hasR2 = content.includes('r2_buckets');

    log(`✓ Wrangler 配置: ${filePath}`, 'green');
    if (hasD1) log('  - D1 数据库绑定已配置', 'green');
    if (hasR2) log('  - R2 存储绑定已配置', 'green');

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
  allGood &= checkWranglerConfig('apps/api/wrangler.jsonc');
  allGood &= checkFile('apps/api/.dev.vars', 'API Secrets 文件');
  allGood &= checkFile('apps/api/.dev.vars.example', 'API Secrets 模板');

  log('');

  // 检查 Web 配置
  log('【Web 应用配置】', 'yellow');
  allGood &= checkWranglerConfig('apps/web/wrangler.jsonc');
  allGood &= checkFile('apps/web/.env.local', 'Web 环境变量');
  allGood &= checkFile('apps/web/.env.local.example', 'Web 环境变量模板');

  log('');

  // 检查数据库配置
  log('【数据库配置】', 'yellow');
  const hasMigrations = checkFile('packages/database/migrations', '迁移目录');
  if (hasMigrations) {
    const migrationsPath = resolve(rootDir, 'packages/database/migrations');
    const migrations = existsSync(migrationsPath);
    if (migrations) {
      log('  - 迁移目录存在，记得运行 pnpm db:migrate:local', 'yellow');
    }
  }

  log('');

  // 检查 VS Code 配置
  log('【VS Code 配置】', 'yellow');
  checkFile('.vscode/launch.json', '调试配置');
  checkFile('.vscode/tasks.json', '任务配置');

  log('');

  // 总结
  log('========================================', 'cyan');
  if (allGood) {
    log('✓ 所有必要配置已就绪！', 'green');
    log('\n快速开始：', 'cyan');
    log('  1. pnpm db:migrate:local    # 初始化数据库', 'cyan');
    log('  2. pnpm api:dev             # 启动 API Worker', 'cyan');
    log('  3. pnpm web:dev             # 启动 Web 应用', 'cyan');
    log('\n或使用组合命令：', 'cyan');
    log('  pnpm debug:full             # 迁移数据库并启动所有服务', 'cyan');
  } else {
    log('✗ 部分配置缺失，请参考 docs/LOCAL-DEBUG.md', 'red');
    log('\n快速修复：', 'yellow');
    log('  cp apps/api/.dev.vars.example apps/api/.dev.vars', 'yellow');
    log('  cp apps/web/.env.local.example apps/web/.env.local', 'yellow');
    log('  # 然后编辑这两个文件填入你的配置', 'yellow');
  }
  log('========================================\n', 'cyan');

  process.exit(allGood ? 0 : 1);
}

main();
