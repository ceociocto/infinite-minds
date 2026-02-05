import { NextRequest, NextResponse } from 'next/server';
import { ZhipuAIService } from '@/lib/services/zhipu';
import type { AgentRole } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // 从 Cloudflare Workers 环境变量获取 API Key
    // 在 Cloudflare Workers 中，环境变量通过 process.env 访问
    const apiKey = process.env.ZHIPU_API_KEY;
    
    console.log('AI API called, ZHIPU_API_KEY exists:', !!apiKey);
    
    if (!apiKey) {
      console.error('ZHIPU_API_KEY not found in environment variables');
      return NextResponse.json(
        { success: false, error: 'ZHIPU_API_KEY not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log('AI API request:', { agentRole: body.agentRole, taskDescription: body.taskDescription?.substring(0, 50) });
    const { agentRole, agentName, taskDescription, context, previousResults, model = 'glm-4-flash' } = body;

    const service = new ZhipuAIService(apiKey, model);
    
    const result = await service.executeAgentTask({
      agentRole: agentRole as AgentRole,
      agentName,
      taskDescription,
      context,
      previousResults,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        content: '' 
      },
      { status: 500 }
    );
  }
}