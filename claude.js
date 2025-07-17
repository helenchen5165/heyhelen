// hey-claude.js

// 1. 导入 dotenv 库：用于从 .env 文件加载环境变量
require('dotenv').config(); 

// 2. 导入 Anthropic SDK 客户端
const Anthropic = require('@anthropic-ai/sdk'); 

// 3. 获取 API 密钥
// 强烈建议通过环境变量 ANTHROPIC_API_KEY 来配置密钥，而不是直接写在代码里
const apiKey = process.env.ANTHROPIC_API_KEY;

// 4. 检查 API 密钥是否已设置
if (!apiKey) {
  console.error("错误：ANTHROPIC_API_KEY 环境变量未设置。");
  console.error("请确保你在项目根目录（与 hey-claude.js 同级）创建了 .env 文件，");
  console.error("并在其中添加了 ANTHROPIC_API_KEY=你的实际API密钥 这行内容。");
  process.exit(1); // 如果密钥未设置，则退出程序
}

// 5. 初始化 Claude 客户端
const client = new Anthropic({
  apiKey: apiKey, // 使用从环境变量中获取的密钥
});

/**
 * 向 Claude 发送代码调优请求并打印回复。
 *
 * @param {string} prompt 包含代码和调优要求的提示文本。
 */
async function getClaudeCodeOptimization(prompt) {
  try {
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022", // 推荐使用 Claude 3 Opus 获取最佳效果，或根据需求选择 Haiku/Sonnet
      max_tokens: 2048,                 // 增加最大 token 数量，以允许 Claude 返回更长的优化建议和代码
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    console.log("--- Claude 的代码调优回复 ---");
    console.log(response.content[0].text);
    console.log("----------------------------");
  } catch (error) {
    console.error("调用 Claude API 时出错：", error.message);
    // 打印完整的错误对象以获取更详细的调试信息
    if (error.response && error.response.status) {
        console.error(`HTTP Status: ${error.response.status}`);
        console.error(`Response Data: ${JSON.stringify(error.response.data)}`);
    } else {
        console.error("完整的错误详情：", error);
    }
    process.exit(1); // 发生错误时退出程序
  }
}

// --- 你的代码调优请求示例 ---

const codeToOptimize = `
// 这是一个简单的 JavaScript 函数，用于查找数组中的最大值和最小值
function findMinMax(arr) {
  if (arr.length === 0) {
    return { min: undefined, max: undefined };
  }

  let minVal = arr[0];
  let maxVal = arr[0];

  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < minVal) {
      minVal = arr[i];
    }
    if (arr[i] > maxVal) {
      maxVal = arr[i];
    }
  }
  return { min: minVal, max: maxVal };
}

// 测试数据
const numbers = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];
console.log(findMinMax(numbers)); // { min: 1, max: 9 }

const emptyArray = [];
console.log(findMinMax(emptyArray)); // { min: undefined, max: undefined }

const singleElementArray = [7];
console.log(findMinMax(singleElementArray)); // { min: 7, max: 7 }
`;

// 构建向 Claude 发送的提示词（Prompt）
const optimizationPrompt = `
我有一个 JavaScript 函数 'findMinMax'，它用于在一个数组中找出最大值和最小值。
我希望你能够帮助我优化这段代码，使其在性能上更高效，并且代码更简洁易读。
请提供优化后的代码，并详细解释你的优化思路。

这是我的原始代码：

\`\`\`javascript
${codeToOptimize}
\`\`\`
`;

// 调用函数，向 Claude 发送调优请求
getClaudeCodeOptimization(optimizationPrompt);