// Multi-Agent Orchestrator
// 多Agent协作编排系统 - 客户端版本（调用服务端API）

import type { AgentRole, NewsArticle, NewsSummary, CodeChange } from '@/types';
import type { GitHubConfig } from './github';

export interface WorkflowProgress {
  workflowId: string;
  stepId: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result?: any;
}

export type ProgressCallback = (progress: WorkflowProgress) => void;

export interface AgentTask {
  id: string;
  agentId: string;
  agentRole: AgentRole;
  description: string;
  dependencies: string[];
  context?: string;
  expectedOutput?: string;
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

export class MultiAgentOrchestrator {
  private progressCallbacks: ProgressCallback[] = [];
  private workflowResults: Map<string, Map<string, AgentTaskResult>> = new Map();
  private githubConfig: GitHubConfig | null = null;

  constructor() {}

  // 设置GitHub配置
  setGitHubConfig(config: GitHubConfig): void {
    this.githubConfig = config;
  }

  // 检查是否有有效的API服务（现在总是返回true，因为由服务端处理）
  isReady(): boolean {
    return true;
  }

  // 检查GitHub服务是否就绪
  isGitHubReady(): boolean {
    return this.githubConfig !== null && !!this.githubConfig.token;
  }

  // 订阅进度更新
  onProgress(callback: ProgressCallback): void {
    this.progressCallbacks.push(callback);
  }

  // 发送进度更新
  private emitProgress(progress: WorkflowProgress): void {
    this.progressCallbacks.forEach((cb) => cb(progress));
  }

  // 调用服务端AI API
  private async callAIAPI(request: {
    agentRole: AgentRole;
    agentName: string;
    taskDescription: string;
    context?: string;
    previousResults?: string[];
    model?: string;
  }): Promise<AgentTaskResult> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'AI API request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('AI API call failed:', error);
      return {
        success: false,
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 执行单个Agent任务
  private async executeSingleTask(
    workflowId: string,
    task: AgentTask,
    previousResults: Map<string, AgentTaskResult>
  ): Promise<AgentTaskResult> {
    // 发送开始进度
    this.emitProgress({
      workflowId,
      stepId: task.id,
      agentId: task.agentId,
      status: 'running',
      progress: 0,
      message: `${task.agentId} 开始执行任务: ${task.description}`,
    });

    try {
      // 构建前置结果上下文
      const previousResultsArray: string[] = [];
      task.dependencies.forEach((depId) => {
        const depResult = previousResults.get(depId);
        if (depResult?.success) {
          previousResultsArray.push(depResult.content);
        }
      });

      // 调用服务端API执行Agent任务
      const result = await this.callAIAPI({
        agentRole: task.agentRole,
        agentName: task.agentId,
        taskDescription: task.description,
        context: task.context,
        previousResults: previousResultsArray.length > 0 ? previousResultsArray : undefined,
      });

      // 发送完成进度
      this.emitProgress({
        workflowId,
        stepId: task.id,
        agentId: task.agentId,
        status: result.success ? 'completed' : 'failed',
        progress: 100,
        message: result.success
          ? `${task.agentId} 完成任务`
          : `${task.agentId} 任务失败: ${result.error}`,
        result: result.success ? result.content : undefined,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      // 发送失败进度
      this.emitProgress({
        workflowId,
        stepId: task.id,
        agentId: task.agentId,
        status: 'failed',
        progress: 0,
        message: `${task.agentId} 任务失败: ${errorMessage}`,
      });

      return {
        success: false,
        content: '',
        error: errorMessage,
      };
    }
  }

  // 执行工作流（支持依赖关系）
  async executeWorkflow(
    workflowId: string,
    tasks: AgentTask[]
  ): Promise<Map<string, AgentTaskResult>> {
    const results = new Map<string, AgentTaskResult>();
    const pendingTasks = new Map(tasks.map((t) => [t.id, t]));
    const completedTasks = new Set<string>();

    // 检查依赖是否满足
    const areDependenciesMet = (task: AgentTask): boolean => {
      return task.dependencies.every((depId) => completedTasks.has(depId));
    };

    // 执行一批任务
    const executeBatch = async () => {
      const readyTasks: AgentTask[] = [];

      // 找出所有依赖已满足的任务
      pendingTasks.forEach((task) => {
        if (areDependenciesMet(task)) {
          readyTasks.push(task);
        }
      });

      // 从待处理列表中移除准备执行的任务
      readyTasks.forEach((task) => pendingTasks.delete(task.id));

      // 并行执行所有准备好的任务
      const taskPromises = readyTasks.map(async (task) => {
        const result = await this.executeSingleTask(workflowId, task, results);
        results.set(task.id, result);
        completedTasks.add(task.id);
      });

      await Promise.all(taskPromises);
    };

    // 循环执行直到所有任务完成
    while (pendingTasks.size > 0) {
      const previousCompletedCount = completedTasks.size;
      await executeBatch();

      // 检查是否有进展
      if (completedTasks.size === previousCompletedCount && pendingTasks.size > 0) {
        // 可能存在循环依赖或无法执行的任务
        const remainingTasks = Array.from(pendingTasks.values());
        remainingTasks.forEach((task) => {
          results.set(task.id, {
            success: false,
            content: '',
            error: '依赖任务未完成或存在循环依赖',
          });
          this.emitProgress({
            workflowId,
            stepId: task.id,
            agentId: task.agentId,
            status: 'failed',
            progress: 0,
            message: `${task.agentId} 无法执行: 依赖未满足`,
          });
        });
        break;
      }
    }

    this.workflowResults.set(workflowId, results);
    return results;
  }

  // ==================== 新闻工作流 ====================
  async executeNewsWorkflow(
    query: string,
    onProgress?: ProgressCallback
  ): Promise<NewsSummary> {
    if (onProgress) {
      this.onProgress(onProgress);
    }

    const workflowId = `news-${Date.now()}`;

    // Define news workflow tasks
    const tasks: AgentTask[] = [
      {
        id: 'research',
        agentId: 'researcher-1',
        agentRole: 'researcher',
        description: `Research and collect the latest news and information about "${query}". Please provide 3-5 relevant news articles with titles, summaries, and sources.`,
        dependencies: [],
        context: `User wants to learn about: ${query}`,
      },
      {
        id: 'summarize',
        agentId: 'writer-1',
        agentRole: 'writer',
        description: `Based on the research results, write a comprehensive summary report about "${query}". Write in English, approximately 300 words.`,
        dependencies: ['research'],
        context: 'Need to write summary based on research data',
      },
      {
        id: 'translate',
        agentId: 'translator-1',
        agentRole: 'translator',
        description: `Translate the English summary into fluent Chinese, maintaining accuracy of professional terminology.`,
        dependencies: ['summarize'],
        context: 'Translate English news summary to Chinese',
      },
    ];

    // 执行工作流
    const results = await this.executeWorkflow(workflowId, tasks);

    // 解析结果
    const researchResult = results.get('research');
    const summarizeResult = results.get('summarize');
    const translateResult = results.get('translate');

    // 解析研究结果为文章列表
    const articles = this.parseArticles(researchResult?.content || '');

    // 检查是否所有任务都失败了（说明AI服务未配置）
    const allFailed = !researchResult?.success && !summarizeResult?.success && !translateResult?.success;

    if (allFailed) {
      return {
        original: '⚠️ AI service not configured or call failed. Please set ZHIPU_API_KEY in Cloudflare Workers environment variables.',
        translated: '⚠️ AI service not configured. Please set ZHIPU_API_KEY in Cloudflare Workers environment variables.',
        articles: this.getMockArticles(),
      };
    }

    return {
      original: summarizeResult?.content || 'Summary generation failed',
      translated: translateResult?.content || 'Translation failed',
      articles: articles.length > 0 ? articles : this.getMockArticles(),
    };
  }

  // Parse article list
  private parseArticles(content: string): NewsArticle[] {
    const articles: NewsArticle[] = [];
    const lines = content.split('\n');
    let currentArticle: Partial<NewsArticle> = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Try to match title (usually starts with number or -)
      if (/^[\d\-*•]/.test(trimmed) && trimmed.length > 10) {
        if (currentArticle.title) {
          articles.push(currentArticle as NewsArticle);
        }
        currentArticle = {
          title: trimmed.replace(/^[\d\-*•]\s*/, ''),
          publishedAt: new Date().toISOString(),
          source: 'AI Research',
        };
      } else if (currentArticle.title && !currentArticle.description) {
        currentArticle.description = trimmed;
      } else if (currentArticle.description && !currentArticle.url) {
        // Try to extract URL
        const urlMatch = trimmed.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          currentArticle.url = urlMatch[0];
        }
      }
    }

    if (currentArticle.title) {
      articles.push(currentArticle as NewsArticle);
    }

    return articles;
  }

  // Mock articles (as fallback)
  private getMockArticles(): NewsArticle[] {
    return [
      {
        title: '[Mock Data] AI Technology Continues to Break Through',
        description: '⚠️ This is mock data because AI service is not configured or call failed. Please set ZHIPU_API_KEY in Cloudflare Workers environment variables to get real data.',
        url: 'https://example.com/news',
        publishedAt: new Date().toISOString(),
        source: 'Mock Data',
      },
    ];
  }

  // ==================== GitHub工作流 ====================
  async executeGitHubWorkflow(
    repoUrl: string,
    requirements: string,
    onProgress?: ProgressCallback
  ): Promise<{ success: boolean; changes: CodeChange[]; pullRequestUrl?: string; summary: string; commitResult?: { branch: string; url: string } }> {
    if (onProgress) {
      this.onProgress(onProgress);
    }

    const workflowId = `github-${Date.now()}`;

    // 解析仓库信息
    const repoMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    const repoInfo = repoMatch
      ? { owner: repoMatch[1], repo: repoMatch[2].replace('.git', '') }
      : { owner: 'unknown', repo: 'unknown' };

    // 检查GitHub服务是否就绪
    const canCommitToGitHub = this.isGitHubReady();
    let existingFiles: { path: string; content: string }[] = [];

    if (canCommitToGitHub) {
      // 获取现有文件内容供AI分析
      this.emitProgress({
        workflowId,
        stepId: 'fetch-files',
        agentId: 'system',
        status: 'running',
        progress: 0,
        message: '正在从GitHub获取仓库文件...',
      });

      try {
        const response = await fetch('/api/github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'getRepositoryFiles',
            owner: repoInfo.owner,
            repo: repoInfo.repo,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          existingFiles = data.files || [];
        }
        
        this.emitProgress({
          workflowId,
          stepId: 'fetch-files',
          agentId: 'system',
          status: 'completed',
          progress: 100,
          message: `成功获取 ${existingFiles.length} 个文件`,
        });
      } catch (error) {
        console.error('获取仓库文件失败:', error);
        this.emitProgress({
          workflowId,
          stepId: 'fetch-files',
          agentId: 'system',
          status: 'failed',
          progress: 0,
          message: `获取文件失败: ${error instanceof Error ? error.message : '未知错误'}`,
        });
      }
    }

    // 定义GitHub工作流的任务
    const tasks: AgentTask[] = [
      {
        id: 'analyze',
        agentId: 'analyst-1',
        agentRole: 'analyst',
        description: `分析GitHub仓库 ${repoInfo.owner}/${repoInfo.repo} 的结构。基于需求"${requirements}"，识别需要修改的关键文件和代码位置。`,
        dependencies: [],
        context: `仓库URL: ${repoUrl}\n需求: ${requirements}${existingFiles.length > 0 ? `\n\n现有文件:\n${existingFiles.slice(0, 10).map(f => `- ${f.path}`).join('\n')}` : ''}`,
      },
      {
        id: 'develop',
        agentId: 'dev-1',
        agentRole: 'developer',
        description: `基于分析结果，为仓库 ${repoInfo.owner}/${repoInfo.repo} 编写代码修改。实现需求: "${requirements}"。请提供完整的代码文件内容。`,
        dependencies: ['analyze'],
        context: `需要修改的仓库: ${repoUrl}${existingFiles.length > 0 ? `\n\n参考现有文件内容:\n${existingFiles.slice(0, 5).map(f => `\n=== ${f.path} ===\n${f.content.substring(0, 1000)}...`).join('\n')}` : ''}`,
      },
      {
        id: 'review',
        agentId: 'pm-1',
        agentRole: 'pm',
        description: `审查代码修改，确保满足需求"${requirements}"，并生成部署计划摘要。`,
        dependencies: ['develop'],
        context: '审查开发完成的代码修改',
      },
    ];

    // 执行工作流
    const results = await this.executeWorkflow(workflowId, tasks);

    // 解析代码变更
    const developResult = results.get('develop');
    const reviewResult = results.get('review');
    const changes = this.parseCodeChanges(developResult?.content || '');

    // 如果GitHub服务就绪，实际提交代码
    let commitResult: { branch: string; url: string } | undefined;
    
    if (canCommitToGitHub && changes.length > 0) {
      this.emitProgress({
        workflowId,
        stepId: 'commit',
        agentId: 'system',
        status: 'running',
        progress: 0,
        message: '正在提交代码到GitHub...',
      });

      try {
        const response = await fetch('/api/github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'commit',
            owner: repoInfo.owner,
            repo: repoInfo.repo,
            changes,
            message: `AI Agent: ${requirements}`,
            branchName: `ai-update-${Date.now()}`,
          }),
        });

        const result = await response.json();

        if (result.success && result.url) {
          commitResult = {
            branch: result.branch,
            url: result.url,
          };
          
          this.emitProgress({
            workflowId,
            stepId: 'commit',
            agentId: 'system',
            status: 'completed',
            progress: 100,
            message: `代码已提交到分支: ${result.branch}`,
          });
        } else {
          this.emitProgress({
            workflowId,
            stepId: 'commit',
            agentId: 'system',
            status: 'failed',
            progress: 0,
            message: `提交失败: ${result.error}`,
          });
        }
      } catch (error) {
        console.error('提交代码失败:', error);
        this.emitProgress({
          workflowId,
          stepId: 'commit',
          agentId: 'system',
          status: 'failed',
          progress: 0,
          message: `提交失败: ${error instanceof Error ? error.message : '未知错误'}`,
        });
      }
    }

    return {
      success: results.get('develop')?.success || false,
      changes: changes.length > 0 ? changes : this.getMockChanges(),
      pullRequestUrl: commitResult?.url,
      summary: reviewResult?.content || '代码修改完成',
      commitResult,
    };
  }

  // 解析代码变更
  private parseCodeChanges(content: string): CodeChange[] {
    const changes: CodeChange[] = [];
    const fileBlocks = content.split(/```\w*\n?/).filter(Boolean);

    for (let i = 0; i < fileBlocks.length; i += 2) {
      const header = fileBlocks[i];
      const code = fileBlocks[i + 1];

      if (header && code) {
        // 尝试提取文件路径
        const pathMatch = header.match(/(?:文件路径|File|Path)[:\s]*([^\n]+)/i) ||
                         header.match(/([\w\-/]+\.[\w]+)/);
        
        if (pathMatch) {
          changes.push({
            path: pathMatch[1].trim(),
            content: code.trim(),
            action: 'update',
          });
        }
      }
    }

    return changes;
  }

  // 模拟代码变更（作为后备）
  private getMockChanges(): CodeChange[] {
    return [
      {
        path: 'README.md',
        content: '# Updated Project\n\nThis project has been modified by AI agents.',
        action: 'update',
      },
    ];
  }

  // ==================== 通用任务工作流 ====================
  async executeGeneralWorkflow(
    taskDescription: string,
    onProgress?: ProgressCallback
  ): Promise<{ success: boolean; result: string; tasksCompleted: number }> {
    if (onProgress) {
      this.onProgress(onProgress);
    }

    const workflowId = `general-${Date.now()}`;

    // PM分析任务并规划
    const pmTask: AgentTask = {
      id: 'plan',
      agentId: 'pm-1',
      agentRole: 'pm',
      description: `分析以下任务并制定执行计划: "${taskDescription}"。请分析需要什么类型的Agent来完成这个任务，以及执行步骤。`,
      dependencies: [],
    };

    const planResult = await this.executeSingleTask(workflowId, pmTask, new Map());

    if (!planResult.success) {
      return {
        success: false,
        result: '任务规划失败: ' + planResult.error,
        tasksCompleted: 0,
      };
    }

    // 根据PM的分析，动态创建执行Agent任务
    // 这里简化处理，使用researcher和writer组合
    const tasks: AgentTask[] = [
      {
        id: 'research',
        agentId: 'researcher-1',
        agentRole: 'researcher',
        description: `研究以下主题: "${taskDescription}"。收集相关信息和数据。`,
        dependencies: ['plan'],
        context: planResult.content,
      },
      {
        id: 'execute',
        agentId: 'writer-1',
        agentRole: 'writer',
        description: `基于研究结果，完成以下任务: "${taskDescription}"。提供详细的输出。`,
        dependencies: ['research'],
        context: `PM的计划: ${planResult.content}`,
      },
    ];

    const results = await this.executeWorkflow(workflowId, tasks);
    const executeResult = results.get('execute');

    return {
      success: executeResult?.success || false,
      result: executeResult?.content || '任务执行失败',
      tasksCompleted: Array.from(results.values()).filter((r) => r.success).length,
    };
  }
}

// 单例模式
let orchestratorInstance: MultiAgentOrchestrator | null = null;

export function getMultiAgentOrchestrator(): MultiAgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new MultiAgentOrchestrator();
  }
  return orchestratorInstance;
}

export function resetMultiAgentOrchestrator(): void {
  orchestratorInstance = null;
}