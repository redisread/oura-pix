#!/usr/bin/env node

/**
 * 分析项目中的无用代码
 * 使用 knip 等工具检测未使用的文件、依赖和导出
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

console.log('🔍 开始分析项目中的无用代码...\n');

// 1. 检查 knip 配置
console.log('📋 检查 knip 配置...');
const knipConfigPath = path.join(ROOT_DIR, 'knip.config.js');
if (!fs.existsSync(knipConfigPath)) {
    console.log('⚠️  未找到 knip.config.js，创建默认配置...');
    const defaultConfig = `/** @type {import('knip').KnipConfig} */
module.exports = {
  ignore: [
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/scripts/**',
    '.cleanup-backup/**',
    '**/.wrangler/**',
    '**/.next/**',
    '**/.astro/**',
  ],
  ignoreDependencies: [
    // 在这里添加需要忽略的依赖
  ],
};
`;
    fs.writeFileSync(knipConfigPath, defaultConfig);
    console.log('✅ 已创建 knip.config.js\n');
}

// 2. 运行 knip 分析
console.log('🔍 运行 knip 分析...');
try {
    const knipOutput = execSync('npx knip --include files,dependencies,unexports', {
        cwd: ROOT_DIR,
        encoding: 'utf-8',
        stdio: 'pipe'
    });
    console.log(knipOutput);
} catch (error) {
    // knip 返回非零退出码表示发现问题，这是正常的
    console.log(error.stdout || error.stderr);
}

// 3. 分析大目录
console.log('\n📊 分析大目录...');
const directoriesToCheck = [
    '.wrangler',
    '.next',
    '.astro',
    '.turbo',
    'node_modules',
    '.cleanup-backup',
    'apps/api/.wrangler/tmp',
];

directoriesToCheck.forEach(dir => {
    const fullPath = path.join(ROOT_DIR, dir);
    if (fs.existsSync(fullPath)) {
        try {
            const size = execSync(`du -sh "${fullPath}"`, {
                encoding: 'utf-8'
            }).split('\t')[0];
            console.log(`  ${dir}: ${size}`);
        } catch (error) {
            // 忽略错误
        }
    }
});

// 4. 检查可能的无用文件
console.log('\n🗂️  检查可能的无用文件...');

const patterns = [
    { name: '备份文件', pattern: '**/*.{bak,old,backup}' },
    { name: '临时文件', pattern: '**/*.{tmp,temp}' },
    { name: '日志文件', pattern: '**/*.log' },
    { name: '测试脚本', pattern: 'scripts/test-*.ts' },
];

patterns.forEach(({ name, pattern }) => {
    try {
        const result = execSync(`find "${ROOT_DIR}" -name "${pattern}" ! -path "*/node_modules/*" 2>/dev/null | wc -l`, {
            encoding: 'utf-8'
        });
        const count = parseInt(result.trim());
        if (count > 0) {
            console.log(`  ${name}: ${count} 个文件`);
        }
    } catch (error) {
        // 忽略错误
    }
});

// 5. 检查未使用的 exports
console.log('\n📦 检查 TypeScript 未使用的导出...');
try {
    // 检查是否有 ts-unused-exports
    execSync('which ts-unused-exports', { stdio: 'ignore' });
    console.log('运行 ts-unused-exports...');
    const output = execSync(`npx ts-unused-exports tsconfig.json --ignoreTests`, {
        cwd: ROOT_DIR,
        encoding: 'utf-8',
        stdio: 'pipe'
    });
    console.log(output);
} catch (error) {
    if (error.message.includes('which')) {
        console.log('⚠️  ts-unused-exports 未安装，跳过...');
    } else {
        console.log('ts-unused-exports 分析完成');
    }
}

// 6. 生成报告
console.log('\n📝 生成分析报告...');
const reportPath = path.join(ROOT_DIR, 'CLEANUP_REPORT.md');
const report = `# 无用代码清理报告

生成时间：${new Date().toISOString()}

## 检测到的问题

### 1. 未使用的文件
- 详见上面的 knip 输出

### 2. 大目录
- .wrangler: 构建缓存
- .next: Next.js 构建产物
- .astro: Astro 缓存
- .cleanup-backup: 旧的备份文件

### 3. 建议清理的操作

1. 运行清理脚本:
\`\`\`bash
./scripts/cleanup-unused-code.sh
\`\`\`

2. 清理构建缓存:
\`\`\`bash
pnpm clean
\`\`\`

3. 重新安装依赖:
\`\`\`bash
rm -rf node_modules
pnpm install
\`\`\`

## 备份

所有清理的文件都会备份到 .cleanup-backup/ 目录下
`;

fs.writeFileSync(reportPath, report);
console.log(`✅ 报告已保存到：${reportPath}`);

console.log('\n✨ 分析完成！');
