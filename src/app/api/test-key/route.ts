import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    const apiKey = process.env.ZHIPU_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        valid: false,
        error: 'ZHIPU_API_KEY not configured',
      });
    }

    // 测试调用智谱AI API
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json({
        valid: false,
        status: response.status,
        error: error.error?.message || `HTTP ${response.status}`,
      });
    }

    const data = await response.json();
    return NextResponse.json({
      valid: true,
      model: data.model,
      message: data.choices?.[0]?.message?.content,
    });
    
  } catch (error) {
    return NextResponse.json({
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}