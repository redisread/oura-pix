/**
 * 测试图片生成功能
 * 直接调用 API 进行测试
 */

const BASE_URL = "https://ourapix.jiahongw.com";

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * 测试配额 API
 */
async function testQuotaApi(): Promise<TestResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/generations?stats=true`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401) {
      return {
        success: false,
        message: "未登录，需要身份验证",
      };
    }

    if (!response.ok) {
      return {
        success: false,
        message: `API 错误: ${response.status}`,
        details: await response.text(),
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: "配额 API 正常",
      details: data,
    };
  } catch (error) {
    return {
      success: false,
      message: `请求失败: ${error}`,
    };
  }
}

/**
 * 测试生成历史 API
 */
async function testHistoryApi(): Promise<TestResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/generations?page=1&pageSize=10`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401) {
      return {
        success: false,
        message: "未登录，需要身份验证",
      };
    }

    if (!response.ok) {
      return {
        success: false,
        message: `API 错误: ${response.status}`,
        details: await response.text(),
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: "历史 API 正常",
      details: data,
    };
  } catch (error) {
    return {
      success: false,
      message: `请求失败: ${error}`,
    };
  }
}

/**
 * 运行所有测试
 */
async function runTests() {
  console.log("🧪 开始测试图片生成功能...\n");

  // 测试 1: 配额 API
  console.log("📊 测试配额 API...");
  const quotaResult = await testQuotaApi();
  console.log(quotaResult.success ? "✅" : "❌", quotaResult.message);
  if (quotaResult.details) {
    console.log("   详情:", JSON.stringify(quotaResult.details, null, 2));
  }
  console.log();

  // 测试 2: 历史 API
  console.log("📜 测试历史 API...");
  const historyResult = await testHistoryApi();
  console.log(historyResult.success ? "✅" : "❌", historyResult.message);
  if (historyResult.details) {
    console.log("   详情:", JSON.stringify(historyResult.details, null, 2));
  }
  console.log();

  // 总结
  console.log("\n📋 测试总结:");
  if (!quotaResult.success && !historyResult.success) {
    console.log("⚠️  需要登录才能测试完整功能");
    console.log("   请访问:", BASE_URL + "/login");
  } else {
    console.log("✅ API 测试通过");
  }
}

// 运行测试
runTests().catch(console.error);
