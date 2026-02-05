// Zhipu AI API Service
// 智谱AI GLM-4 API 对接服务

import type { AgentRole } from '@/types';

export interface ZhipuMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ZhipuRequest {
  model: string;
  messages: ZhipuMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ZhipuResponse {
  id: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AgentTaskRequest {
  agentRole: AgentRole;
  agentName: string;
  taskDescription: string;
  context?: string;
  previousResults?: string[];
}

export interface AgentTaskResult {
  success: boolean;
  content: string;
  metadata?: {
    tokensUsed?: number;
    processingTime?: number;
    model?: string;
  };
  error?: string;
}

// 智谱AI API 配置
const ZHIPU_API_BASE = 'https://open.bigmodel.cn/api/paas/v4';
const DEFAULT_MODEL = 'glm-4-flash'; // 使用flash模型，更快更便宜

// Agent 角色系统提示词
const AGENT_SYSTEM_PROMPTS: Record<AgentRole, string> = {
  pm: `你是PM-Bot，一个专业的项目经理Agent。你的职责是：
1. 分析用户需求，制定项目计划
2. 协调其他Agent的工作
3. 确保项目按时高质量完成
4. 及时汇报进度和风险

回复格式要求：
- 首先给出任务分析和计划
- 然后列出具体执行步骤
- 最后给出预期结果和时间估算`,

  researcher: `你是Research-Bot，一个专业的研究员Agent。你的职责是：
1. 深入研究指定主题，收集相关信息
2. 分析数据，提取关键洞察
3. 提供结构化的研究报告
4. 确保信息准确性和时效性

回复格式要求：
- 首先列出主要发现
- 然后提供详细分析
- 最后给出数据来源和建议`,

  writer: `你是Writer-Bot，一个专业的内容创作Agent。你的职责是：
1. 根据研究资料撰写高质量内容
2. 优化文章结构和语言表达
3. 确保内容逻辑清晰、引人入胜
4. 适应不同平台和受众需求

回复格式要求：
- 提供完整的内容文本
- 包含标题和正文
- 语言流畅，结构清晰`,

  translator: `你是Translate-Bot，一个专业的翻译Agent。你的职责是：
1. 准确翻译各种语言的内容
2. 保持原文的语气和风格
3. 确保专业术语翻译准确
4. 使译文自然流畅

回复格式要求：
- 直接提供翻译后的内容
- 保持原文格式
- 如有必要，解释翻译选择`,

  developer: `你是Dev-Bot，一个专业的开发Agent。你的职责是：
1. 编写高质量、可维护的代码
2. 进行代码审查和优化
3. 解决技术难题
4. 提供技术方案和建议

回复格式要求：
- 提供完整的代码实现
- 包含必要的注释
- 解释关键逻辑和设计决策`,

  analyst: `你是Data-Bot，一个专业的数据分析师Agent。你的职责是：
1. 分析数据集，发现模式和趋势
2. 生成数据可视化建议
3. 提供数据驱动的洞察
4. 验证数据质量和准确性

回复格式要求：
- 列出关键发现和指标
- 提供数据支持的分析
- 给出 actionable 的建议`,

  designer: `你是Designer-Bot，一个专业的设计Agent。你的职责是：
1. 创建视觉设计和用户界面
2. 提供设计规范和样式指南
3. 优化用户体验
4. 生成设计描述和规格

回复格式要求：
- 描述设计理念和方案
- 提供具体的视觉建议
- 包含颜色、布局、字体等细节`,
};

export class ZhipuAIService {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = ZHIPU_API_BASE;
  }

  // 生成JWT Token (智谱AI使用JWT认证)
  private generateToken(): string {
    // 注意：在实际生产环境中，应该在服务端生成JWT
    // 这里简化处理，直接使用API Key
    return this.apiKey;
  }

  // 发送请求到智谱AI API
  private async sendRequest(messages: ZhipuMessage[]): Promise<ZhipuResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API请求失败: ${response.status} - ${errorData.error?.message || response.statusText}`
        );
      }

      const data: ZhipuResponse = await response.json();
      
      return {
        ...data,
        usage: {
          ...data.usage,
          total_tokens: data.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error('智谱AI API调用失败:', error);
      throw error;
    }
  }

  // 执行Agent任务
  async executeAgentTask(request: AgentTaskRequest): Promise<AgentTaskResult> {
    const startTime = Date.now();
    
    try {
      const systemPrompt = AGENT_SYSTEM_PROMPTS[request.agentRole];
      
      // 构建上下文信息
      let contextInfo = '';
      if (request.context) {
        contextInfo = `\n\n上下文信息：\n${request.context}`;
      }
      
      if (request.previousResults && request.previousResults.length > 0) {
        contextInfo += `\n\n前置任务结果：\n${request.previousResults.join('\n---\n')}`;
      }

      const messages: ZhipuMessage[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `任务：${request.taskDescription}${contextInfo}`,
        },
      ];

      const response = await this.sendRequest(messages);
      const content = response.choices[0]?.message?.content || '';
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        content,
        metadata: {
          tokensUsed: response.usage?.total_tokens,
          processingTime,
          model: this.model,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      return {
        success: false,
        content: '',
        error: errorMessage,
        metadata: {
          processingTime: Date.now() - startTime,
          model: this.model,
        },
      };
    }
  }

  // 流式执行Agent任务
  async executeAgentTaskStream(
    request: AgentTaskRequest,
    onChunk: (chunk: string) => void,
    onComplete: (result: AgentTaskResult) => void
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      const systemPrompt = AGENT_SYSTEM_PROMPTS[request.agentRole];
      
      let contextInfo = '';
      if (request.context) {
        contextInfo = `\n\n上下文信息：\n${request.context}`;
      }
      
      if (request.previousResults && request.previousResults.length > 0) {
        contextInfo += `\n\n前置任务结果：\n${request.previousResults.join('\n---\n')}`;
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `任务：${request.taskDescription}${contextInfo}` },
          ],
          temperature: 0.7,
          max_tokens: 4096,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() === '' || line.trim() === 'data: [DONE]') continue;
          
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                onChunk(content);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      const processingTime = Date.now() - startTime;
      
      onComplete({
        success: true,
        content: fullContent,
        metadata: {
          processingTime,
          model: this.model,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      const processingTime = Date.now() - startTime;
      
      onComplete({
        success: false,
        content: '',
        error: errorMessage,
        metadata: {
          processingTime,
          model: this.model,
        },
      });
    }
  }

  // 测试API连接
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.sendRequest([
        { role: 'user', content: 'Hello' },
      ]);
      
      if (response.choices && response.choices.length > 0) {
        return {
          success: true,
          message: `连接成功！模型: ${response.model}`,
        };
      }
      
      return {
        success: false,
        message: 'API响应异常',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '连接失败',
      };
    }
  }
}

// 单例模式
let zhipuServiceInstance: ZhipuAIService | null = null;

export function getZhipuService(apiKey?: string, model?: string): ZhipuAIService | null {
  if (apiKey) {
    zhipuServiceInstance = new ZhipuAIService(apiKey, model);
  }
  return zhipuServiceInstance;
}

export function resetZhipuService(): void {
  zhipuServiceInstance = null;
}
