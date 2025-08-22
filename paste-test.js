// 粘贴功能测试脚本
// 在浏览器控制台中运行此脚本来测试粘贴功能

console.log('🔍 开始粘贴功能测试...');

// 1. 检查浏览器API支持
function checkBrowserSupport() {
  console.log('\n📋 检查浏览器支持:');
  
  // 检查剪贴板API
  if (navigator.clipboard) {
    console.log('✅ navigator.clipboard API 可用');
  } else {
    console.log('❌ navigator.clipboard API 不可用');
  }
  
  // 检查document.execCommand
  if (document.execCommand) {
    console.log('✅ document.execCommand 可用');
  } else {
    console.log('❌ document.execCommand 不可用');
  }
  
  // 检查Selection API
  if (window.getSelection) {
    console.log('✅ window.getSelection 可用');
  } else {
    console.log('❌ window.getSelection 不可用');
  }
}

// 2. 测试剪贴板权限
async function testClipboardPermissions() {
  console.log('\n🔒 测试剪贴板权限:');
  
  try {
    // 测试读取权限
    if (navigator.permissions && navigator.permissions.query) {
      const readPermission = await navigator.permissions.query({ name: 'clipboard-read' });
      console.log(`📖 读取权限: ${readPermission.state}`);
      
      const writePermission = await navigator.permissions.query({ name: 'clipboard-write' });
      console.log(`✏️ 写入权限: ${writePermission.state}`);
    } else {
      console.log('⚠️ 权限API不可用');
    }
  } catch (error) {
    console.log('❌ 权限检查失败:', error.message);
  }
  
  // 测试实际读取
  try {
    const text = await navigator.clipboard.readText();
    console.log('✅ 可以读取剪贴板');
    console.log('📝 当前剪贴板内容:', text.substring(0, 50));
  } catch (error) {
    console.log('❌ 无法读取剪贴板:', error.message);
  }
}

// 3. 测试RichTextEditor组件
function testRichTextEditor() {
  console.log('\n🎯 测试RichTextEditor组件:');
  
  // 查找编辑器元素
  const editor = document.querySelector('[contenteditable="true"]');
  if (!editor) {
    console.log('❌ 找不到contenteditable元素');
    return;
  }
  
  console.log('✅ 找到编辑器元素');
  
  // 检查焦点
  const hasFocus = document.activeElement === editor;
  console.log(`🎯 编辑器焦点: ${hasFocus ? '有' : '无'}`);
  
  // 检查选择区域
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    console.log('✅ 有选择区域');
    console.log('📍 选择位置:', range.startOffset, '-', range.endOffset);
  } else {
    console.log('❌ 没有选择区域');
  }
  
  // 模拟粘贴事件
  console.log('\n⚡ 模拟粘贴事件:');
  
  // 创建模拟剪贴板数据
  const mockClipboardData = {
    getData: (format) => {
      if (format === 'text/plain') {
        return '测试文本内容';
      } else if (format === 'text/html') {
        return '<p>测试<strong>HTML</strong>内容</p>';
      }
      return '';
    }
  };
  
  // 创建模拟粘贴事件
  const pasteEvent = new ClipboardEvent('paste', {
    clipboardData: mockClipboardData,
    bubbles: true,
    cancelable: true
  });
  
  // 确保编辑器有焦点
  editor.focus();
  
  // 分发事件
  const result = editor.dispatchEvent(pasteEvent);
  console.log(`📨 粘贴事件分发结果: ${result}`);
  
  // 检查内容是否变化
  setTimeout(() => {
    console.log('📄 编辑器内容:', editor.innerHTML);
  }, 100);
}

// 4. 提供修复建议
function provideFixes() {
  console.log('\n🔧 常见问题修复建议:');
  
  console.log('1. 权限问题:');
  console.log('   - 确保HTTPS环境 (localhost除外)');
  console.log('   - 检查浏览器设置是否阻止剪贴板访问');
  
  console.log('2. 焦点问题:');
  console.log('   - 确保编辑器有焦点');
  console.log('   - 检查是否有其他元素阻止焦点');
  
  console.log('3. 选择区域问题:');
  console.log('   - 确保有有效的选择区域');
  console.log('   - 异步操作可能丢失选择区域');
  
  console.log('4. 事件处理问题:');
  console.log('   - 检查事件监听器是否正确绑定');
  console.log('   - 避免过早调用preventDefault()');
}

// 运行所有测试
async function runAllTests() {
  checkBrowserSupport();
  await testClipboardPermissions();
  testRichTextEditor();
  provideFixes();
  
  console.log('\n✅ 测试完成!');
}

// 启动测试
runAllTests().catch(console.error);