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

// Zhipu AI API Configuration
const ZHIPU_API_BASE = 'https://open.bigmodel.cn/api/paas/v4';
const DEFAULT_MODEL = 'glm-4-flash'; // Using flash model for faster and cheaper responses

// Agent Role System Prompts (English)
const AGENT_SYSTEM_PROMPTS: Record<AgentRole, string> = {
  pm: `You are PM-Bot, a professional Project Manager Agent. Your responsibilities are:
1. Analyze user requirements and create project plans
2. Coordinate the work of other Agents
3. Ensure projects are completed on time with high quality
4. Report progress and risks promptly

Response format requirements:
- First provide task analysis and planning
- Then list specific execution steps
- Finally give expected results and time estimates`,

  researcher: `You are Research-Bot, a professional Researcher Agent. Your responsibilities are:
1. Conduct in-depth research on specified topics and gather relevant information
2. Analyze data and extract key insights
3. Provide structured research reports
4. Ensure information accuracy and timeliness

Response format requirements:
- First list main findings
- Then provide detailed analysis
- Finally give data sources and recommendations`,

  writer: `You are Writer-Bot, a professional Content Writer Agent. Your responsibilities are:
1. Write high-quality content based on research materials
2. Optimize article structure and language expression
3. Ensure content is logical and engaging
4. Adapt to different platforms and audience needs

Response format requirements:
- Provide complete content text
- Include title and body
- Language should be fluent and well-structured`,

  translator: `You are Translate-Bot, a professional Translator Agent. Your responsibilities are:
1. Accurately translate content between various languages
2. Maintain the tone and style of the original text
3. Ensure accurate translation of professional terminology
4. Make translations natural and fluent

Response format requirements:
- Directly provide translated content
- Maintain original format
- Explain translation choices if necessary`,

  developer: `You are Dev-Bot, a professional Developer Agent. Your responsibilities are:
1. Write high-quality, maintainable code
2. Conduct code reviews and optimization
3. Solve technical challenges
4. Provide technical solutions and recommendations

Response format requirements:
- Provide complete code implementation
- Include necessary comments
- Explain key logic and design decisions`,

  analyst: `You are Data-Bot, a professional Data Analyst Agent. Your responsibilities are:
1. Analyze datasets to discover patterns and trends
2. Generate data visualization recommendations
3. Provide data-driven insights
4. Verify data quality and accuracy

Response format requirements:
- List key findings and metrics
- Provide data-supported analysis
- Give actionable recommendations`,

  designer: `You are Designer-Bot, a professional Designer Agent. Your responsibilities are:
1. Create visual designs and user interfaces
2. Provide design specifications and style guides
3. Optimize user experience
4. Generate design descriptions and specifications

Response format requirements:
- Describe design concepts and solutions
- Provide specific visual recommendations
- Include details on colors, layout, fonts, etc.`,
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

  // Generate JWT Token (Zhipu AI uses JWT authentication)
  private generateToken(): string {
    // Note: In production, JWT should be generated on the server side
    // Simplified here, using API Key directly
    return this.apiKey;
  }

  // Send request to Zhipu AI API
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
          `API request failed: ${response.status} - ${errorData.error?.message || response.statusText}`
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
      console.error('Zhipu AI API call failed:', error);
      throw error;
    }
  }

  // Execute Agent task
  async executeAgentTask(request: AgentTaskRequest): Promise<AgentTaskResult> {
    const startTime = Date.now();
    
    try {
      const systemPrompt = AGENT_SYSTEM_PROMPTS[request.agentRole];
      
      // Build context information
      let contextInfo = '';
      if (request.context) {
        contextInfo = `\n\nContext Information:\n${request.context}`;
      }
      
      if (request.previousResults && request.previousResults.length > 0) {
        contextInfo += `\n\nPrevious Task Results:\n${request.previousResults.join('\n---\n')}`;
      }

      const messages: ZhipuMessage[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Task: ${request.taskDescription}${contextInfo}`,
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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

  // Stream execute Agent task
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
        contextInfo = `\n\nContext Information:\n${request.context}`;
      }
      
      if (request.previousResults && request.previousResults.length > 0) {
        contextInfo += `\n\nPrevious Task Results:\n${request.previousResults.join('\n---\n')}`;
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
            { role: 'user', content: `Task: ${request.taskDescription}${contextInfo}` },
          ],
          temperature: 0.7,
          max_tokens: 4096,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (!reader) {
        throw new Error('Unable to read response stream');
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
              // Ignore parsing errors
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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

  // Test API connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.sendRequest([
        { role: 'user', content: 'Hello' },
      ]);

      if (response.choices && response.choices.length > 0) {
        return {
          success: true,
          message: `Connection successful! Model: ${response.model}`,
        };
      }

      return {
        success: false,
        message: 'API response abnormal',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
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
