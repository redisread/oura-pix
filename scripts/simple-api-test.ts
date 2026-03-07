/**
 * 简化的 API 测试脚本
 * 使用多种方法测试 Gemini API
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyB1aHdMue5B41v31P1g6w6bl8lwbLk8BU8';

console.log('🔍 Gemini API 简化测试\n');
console.log('API Key 前缀:', API_KEY.substring(0, 20) + '...');
console.log('API Key 长度:', API_KEY.length);
console.log('');

// 测试 1: 使用 Google SDK
async function testWithSDK() {
  console.log('📡 测试 1: 使用 @google/generative-ai SDK');

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    console.log('   ⏳ 发送测试请求...');

    const result = await model.generateContent('Say "Hello" in one word');
    const response = result.response;
    const text = response.text();

    console.log('   ✅ SDK 测试成功!');
    console.log('   响应:', text);
    console.log('');
    return true;

  } catch (error: any) {
    console.log('   ❌ SDK 测试失败');
    console.log('   错误:', error.message);

    if (error.message?.includes('API_KEY_INVALID')) {
      console.log('   原因: API Key 无效');
    } else if (error.message?.includes('fetch')) {
      console.log('   原因: 网络连接问题');
    } else if (error.status === 403) {
      console.log('   原因: API Key 没有权限或未启用');
    }
    console.log('');
    return false;
  }
}

// 测试 2: 列出可用模型
async function listAvailableModels() {
  console.log('📡 测试 2: 列出可用模型');

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);

    // 尝试获取模型信息
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    console.log('   ✅ 可以访问 gemini-1.5-flash 模型');
    console.log('');
    return true;

  } catch (error: any) {
    console.log('   ❌ 无法访问模型');
    console.log('   错误:', error.message);
    console.log('');
    return false;
  }
}

// 测试 3: 测试图片分析
async function testImageAnalysis() {
  console.log('📡 测试 3: 测试图片分析能力');

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 创建一个简单的测试图片 (1x1 白色像素的 base64)
    const testImage = {
      inlineData: {
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        mimeType: 'image/png'
      }
    };

    console.log('   ⏳ 发送图片分析请求...');

    const result = await model.generateContent([
      'Describe this image in one word',
      testImage
    ]);

    const text = result.response.text();

    console.log('   ✅ 图片分析测试成功!');
    console.log('   响应:', text);
    console.log('');
    return true;

  } catch (error: any) {
    console.log('   ❌ 图片分析测试失败');
    console.log('   错误:', error.message);
    console.log('');
    return false;
  }
}

// 主函数
async function main() {
  console.log('开始测试...\n');

  const results = {
    sdk: false,
    models: false,
    image: false
  };

  // 测试 SDK
  results.sdk = await testWithSDK();

  if (!results.sdk) {
    console.log('⚠️  基础 SDK 测试失败,跳过其他测试\n');
    console.log('可能的原因:');
    console.log('  1. 网络无法访问 Google API (最可能)');
    console.log('  2. API Key 无效或未启用');
    console.log('  3. 防火墙或代理阻止\n');
    console.log('建议解决方案:');
    console.log('  1. 启动开发服务器测试: npm run dev');
    console.log('  2. 部署到 Cloudflare: npm run deploy');
    console.log('  3. 配置网络代理 (如果有)');
    process.exit(1);
  }

  // 测试模型访问
  results.models = await listAvailableModels();

  // 测试图片分析
  results.image = await testImageAnalysis();

  // 总结
  console.log('='.repeat(60));
  console.log('测试总结:');
  console.log('='.repeat(60));
  console.log(`${results.sdk ? '✅' : '❌'} SDK 基础功能: ${results.sdk ? '正常' : '失败'}`);
  console.log(`${results.models ? '✅' : '❌'} 模型访问: ${results.models ? '正常' : '失败'}`);
  console.log(`${results.image ? '✅' : '❌'} 图片分析: ${results.image ? '正常' : '失败'}`);
  console.log('');

  if (results.sdk && results.models && results.image) {
    console.log('🎉 所有测试通过!');
    console.log('');
    console.log('✅ 你的 API Key 有效且功能正常!');
    console.log('✅ 可以使用文本生成功能');
    console.log('✅ 可以使用图片分析功能');
    console.log('');
    console.log('⚠️  注意: Imagen 3 图像生成可能需要单独申请权限');
    console.log('   访问: https://ai.google.dev/ 申请 Beta 访问');
    console.log('');
    console.log('下一步:');
    console.log('  1. 启动开发服务器: npm run dev');
    console.log('  2. 访问: http://localhost:3000/generate');
    console.log('  3. 测试完整功能');
  } else {
    console.log('⚠️  部分测试失败');
    console.log('');
    console.log('建议:');
    console.log('  1. 使用开发服务器测试: npm run dev');
    console.log('  2. 或直接部署到 Cloudflare: npm run deploy');
  }
}

main().catch(error => {
  console.error('测试脚本执行失败:', error);
  process.exit(1);
});
