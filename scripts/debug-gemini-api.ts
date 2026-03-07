/**
 * Gemini API 详细调试脚本
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyB1aHdMue5B41v31P1g6w6bl8lwbLk8BU8';

console.log('🔍 Gemini API 调试信息\n');
console.log('API Key:', GEMINI_API_KEY.substring(0, 20) + '...');
console.log('API Key 长度:', GEMINI_API_KEY.length);
console.log('');

// 测试 1: 基础 Gemini API (文本生成)
async function testBasicGemini() {
  console.log('📡 测试 1: Gemini 基础 API (文本生成)');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Say hello in one word'
            }]
          }]
        })
      }
    );

    console.log('状态码:', response.status);
    console.log('状态文本:', response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ 错误响应:', errorText);

      if (response.status === 403) {
        console.log('\n可能的原因:');
        console.log('  1. API Key 无效或已过期');
        console.log('  2. API Key 没有启用 Gemini API');
        console.log('  3. 需要在 Google Cloud Console 启用 API');
      } else if (response.status === 429) {
        console.log('\n可能的原因:');
        console.log('  1. API 调用频率超过限制');
        console.log('  2. 配额已用尽');
      }
      return false;
    }

    const data = await response.json();
    console.log('✅ Gemini 基础 API 测试成功!');
    console.log('响应:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
    return true;

  } catch (error: any) {
    console.log('❌ 网络错误:', error.message);
    console.log('\n可能的原因:');
    console.log('  1. 网络连接问题');
    console.log('  2. 防火墙或代理阻止');
    console.log('  3. DNS 解析失败');
    return false;
  }
}

// 测试 2: Imagen 3 API
async function testImagen3() {
  console.log('\n📡 测试 2: Imagen 3 API (图像生成)');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GEMINI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: 'a simple white cube on white background',
          numberOfImages: 1,
          aspectRatio: '1:1'
        })
      }
    );

    console.log('状态码:', response.status);
    console.log('状态文本:', response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ 错误响应:', errorText);

      if (response.status === 403 || response.status === 404) {
        console.log('\n⚠️  Imagen 3 API 访问被拒绝');
        console.log('原因:');
        console.log('  1. Imagen 3 可能需要单独申请访问权限');
        console.log('  2. API 可能处于 Beta 阶段,需要申请加入');
        console.log('  3. 当前 API Key 可能没有 Imagen 3 权限');
        console.log('\n解决方案:');
        console.log('  1. 访问: https://ai.google.dev/');
        console.log('  2. 申请 Imagen 3 Beta 访问权限');
        console.log('  3. 等待审核通过');
      }
      return false;
    }

    const data = await response.json();
    console.log('✅ Imagen 3 API 测试成功!');
    console.log('响应:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
    return true;

  } catch (error: any) {
    console.log('❌ 网络错误:', error.message);
    return false;
  }
}

// 测试 3: 列出可用模型
async function listModels() {
  console.log('\n📡 测试 3: 列出可用的 Gemini 模型');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ 错误:', errorText);
      return false;
    }

    const data = await response.json();
    console.log('✅ 成功获取模型列表');

    if (data.models && Array.isArray(data.models)) {
      console.log(`\n找到 ${data.models.length} 个可用模型:`);

      // 查找 Imagen 相关模型
      const imagenModels = data.models.filter((m: any) =>
        m.name && m.name.toLowerCase().includes('imagen')
      );

      if (imagenModels.length > 0) {
        console.log('\n✅ 找到 Imagen 模型:');
        imagenModels.forEach((m: any) => {
          console.log(`  - ${m.name}`);
        });
      } else {
        console.log('\n⚠️  未找到 Imagen 模型');
        console.log('这意味着当前 API Key 可能没有 Imagen 3 访问权限');
      }

      // 列出所有模型
      console.log('\n所有可用模型:');
      data.models.slice(0, 10).forEach((m: any) => {
        console.log(`  - ${m.name}`);
      });
      if (data.models.length > 10) {
        console.log(`  ... 还有 ${data.models.length - 10} 个模型`);
      }
    }

    return true;

  } catch (error: any) {
    console.log('❌ 网络错误:', error.message);
    return false;
  }
}

// 主函数
async function main() {
  console.log('开始调试...\n');

  // 测试基础 Gemini API
  const basicSuccess = await testBasicGemini();

  if (!basicSuccess) {
    console.log('\n❌ 基础 API 测试失败,跳过后续测试');
    console.log('\n建议:');
    console.log('  1. 检查网络连接');
    console.log('  2. 验证 API Key 是否正确');
    console.log('  3. 在 Google Cloud Console 检查 API 是否已启用');
    console.log('  4. 访问: https://console.cloud.google.com/apis/');
    process.exit(1);
  }

  // 列出可用模型
  await listModels();

  // 测试 Imagen 3
  const imagenSuccess = await testImagen3();

  console.log('\n' + '='.repeat(60));
  console.log('调试总结:');
  console.log('='.repeat(60));
  console.log(`✅ Gemini 基础 API: ${basicSuccess ? '正常' : '失败'}`);
  console.log(`${imagenSuccess ? '✅' : '⚠️ '} Imagen 3 API: ${imagenSuccess ? '正常' : '需要申请权限'}`);

  if (basicSuccess && !imagenSuccess) {
    console.log('\n📋 下一步操作:');
    console.log('  1. 你的 API Key 有效,可以使用基础 Gemini API');
    console.log('  2. 但 Imagen 3 需要单独申请访问权限');
    console.log('  3. 访问: https://ai.google.dev/ 申请 Imagen 3 Beta 访问');
    console.log('  4. 或者先使用文本生成功能,等待 Imagen 3 权限');
  }

  if (basicSuccess && imagenSuccess) {
    console.log('\n🎉 恭喜!所有 API 测试通过!');
    console.log('你可以开始使用完整的功能了!');
  }
}

main().catch(error => {
  console.error('调试脚本执行失败:', error);
  process.exit(1);
});
