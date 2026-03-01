/**
 * 环境变量验证模块
 *
 * 用于验证应用启动时所需的环境变量是否正确配置
 */

import { getCloudflareContext } from './cloudflare-context';

/**
 * 验证必需的环境变量
 *
 * @throws {Error} 如果缺少必需的环境变量
 */
export function validateEnv() {
  const required: Record<string, string> = {
    'AUTH_SECRET': '认证密钥（使用 openssl rand -base64 32 生成）',
    'NEXT_PUBLIC_APP_URL': '应用基础 URL',
  };

  const missing: string[] = [];
  const details: string[] = [];

  for (const [key, description] of Object.entries(required)) {
    if (!process.env[key]) {
      missing.push(key);
      details.push(`  - ${key}: ${description}`);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `缺少必需的环境变量:\n\n${details.join('\n')}\n\n` +
      `请检查您的 .env.local 文件。\n` +
      `参考 .env.example 文件获取完整配置示例。`
    );
  }
}

/**
 * 验证可选但推荐的环境变量
 *
 * @returns {string[]} 缺少的可选环境变量列表
 */
export function validateOptionalEnv(): string[] {
  const optional: Record<string, string> = {
    'STRIPE_SECRET_KEY': 'Stripe 支付功能',
    'GEMINI_API_KEY': 'AI 图片生成功能',
    'AUTH_GOOGLE_ID': 'Google OAuth 登录',
    'AUTH_GITHUB_ID': 'GitHub OAuth 登录',
  };

  const missing: string[] = [];

  for (const [key, feature] of Object.entries(optional)) {
    if (!process.env[key]) {
      missing.push(`${key} (${feature})`);
    }
  }

  return missing;
}

/**
 * 验证 Cloudflare bindings
 *
 * @throws {Error} 如果缺少必需的 Cloudflare bindings
 */
export async function validateBindings() {
  try {
    const { env } = await getCloudflareContext();

    const errors: string[] = [];

    if (!env.DB) {
      errors.push('D1 数据库绑定 (DB) 未配置');
    }

    if (!env.R2) {
      errors.push('R2 存储绑定 (R2) 未配置');
    }

    if (errors.length > 0) {
      throw new Error(
        `Cloudflare bindings 配置错误:\n\n${errors.map(e => `  - ${e}`).join('\n')}\n\n` +
        `请检查 wrangler.toml 配置文件。`
      );
    }
  } catch (error) {
    // 在开发环境中，如果 wrangler 未启动，提供友好的错误信息
    if (error instanceof Error && error.message.includes('getCloudflareContext')) {
      throw new Error(
        'Cloudflare 上下文不可用。\n\n' +
        '如果您在本地开发:\n' +
        '  1. 确保已安装 wrangler: npm install -g wrangler\n' +
        '  2. 使用 npm run dev 启动开发服务器\n\n' +
        '如果您在生产环境:\n' +
        '  请检查 wrangler.toml 中的 bindings 配置'
      );
    }
    throw error;
  }
}

/**
 * 验证 Stripe 配置
 *
 * @throws {Error} 如果 Stripe 配置不完整
 */
export function validateStripeConfig() {
  const required = [
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Stripe 配置不完整，缺少以下环境变量:\n` +
      `${missing.map(k => `  - ${k}`).join('\n')}\n\n` +
      `请在 https://dashboard.stripe.com/apikeys 获取密钥。`
    );
  }

  // 验证价格 ID
  const priceIds = [
    'STRIPE_STARTER_PRICE_ID',
    'STRIPE_PRO_PRICE_ID',
    'STRIPE_ENTERPRISE_PRICE_ID',
    'STRIPE_CREDITS_SMALL_PRICE_ID',
    'STRIPE_CREDITS_MEDIUM_PRICE_ID',
    'STRIPE_CREDITS_LARGE_PRICE_ID',
  ];

  const missingPriceIds = priceIds.filter(key => !process.env[key]);

  if (missingPriceIds.length > 0) {
    console.warn(
      `⚠️  警告: 以下 Stripe 价格 ID 未配置:\n` +
      `${missingPriceIds.map(k => `  - ${k}`).join('\n')}\n` +
      `某些支付功能可能无法正常工作。`
    );
  }
}

/**
 * 验证 Gemini AI 配置
 *
 * @throws {Error} 如果 Gemini API Key 未配置
 */
export function validateGeminiConfig() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'Gemini API Key 未配置。\n\n' +
      '请在 https://aistudio.google.com/app/apikey 获取 API Key，\n' +
      '并将其设置为 GEMINI_API_KEY 环境变量。'
    );
  }
}

/**
 * 完整的环境验证
 *
 * 在应用启动时调用，验证所有必需的配置
 */
export async function validateEnvironment() {
  console.log('🔍 验证环境配置...');

  // 1. 验证必需的环境变量
  try {
    validateEnv();
    console.log('✅ 必需的环境变量已配置');
  } catch (error) {
    console.error('❌ 环境变量验证失败:');
    if (error instanceof Error) {
      console.error(error.message);
    }
    throw error;
  }

  // 2. 检查可选的环境变量
  const missingOptional = validateOptionalEnv();
  if (missingOptional.length > 0) {
    console.warn('⚠️  以下可选功能未配置:');
    missingOptional.forEach(item => console.warn(`  - ${item}`));
  }

  // 3. 验证 Cloudflare bindings（仅在服务器端）
  if (typeof window === 'undefined') {
    try {
      await validateBindings();
      console.log('✅ Cloudflare bindings 已配置');
    } catch (error) {
      console.error('❌ Cloudflare bindings 验证失败:');
      if (error instanceof Error) {
        console.error(error.message);
      }
      // 在开发环境中，bindings 可能暂时不可用，给出警告而不是抛出错误
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  继续启动，但某些功能可能不可用');
      } else {
        throw error;
      }
    }
  }

  console.log('✅ 环境配置验证完成\n');
}
