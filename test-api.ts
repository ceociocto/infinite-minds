// 测试智谱AI API Key 有效性
async function testZhipuAPI() {
  const apiKey = process.env.ZHIPU_API_KEY;
  
  if (!apiKey) {
    console.error('❌ ZHIPU_API_KEY not found in environment variables');
    process.exit(1);
  }

  console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');
  
  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          { role: 'user', content: 'Hello, are you working?' }
        ],
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('❌ API request failed:', response.status, error);
      process.exit(1);
    }

    const data = await response.json();
    console.log('✅ API Key is valid!');
    console.log('📊 Response:', data.choices?.[0]?.message?.content);
    console.log('🤖 Model:', data.model);
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
    process.exit(1);
  }
}

testZhipuAPI();