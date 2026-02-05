// Multi-Agent Orchestrator
// 多Agent协作编排系统

import type { AgentRole, NewsArticle, NewsSummary, CodeChange } from '@/types';
import { ZhipuAIService, type AgentTaskRequest, type AgentTaskResult } from './zhipu';
import { GitHubService, type GitHubConfig } from './github';

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

export class MultiAgentOrchestrator {
  private zhipuService: ZhipuAIService | null = null;
  private githubService: GitHubService | null = null;
  private progressCallbacks: ProgressCallback[] = [];
  private workflowResults: Map<string, Map<string, AgentTaskResult>> = new Map();

  constructor(apiKey?: string, model?: string, githubConfig?: GitHubConfig) {
    if (apiKey) {
      this.zhipuService = new ZhipuAIService(apiKey, model);
    }
    if (githubConfig) {
      this.githubService = new GitHubService(githubConfig);
    }
  }

  // 设置API密钥
  setApiKey(apiKey: string, model?: string): void {
    this.zhipuService = new ZhipuAIService(apiKey, model);
  }

  // 设置GitHub配置
  setGitHubConfig(config: GitHubConfig): void {
    this.githubService = new GitHubService(config);
  }

  // 检查是否有有效的API服务
  isReady(): boolean {
    return this.zhipuService !== null;
  }

  // 检查GitHub服务是否就绪
  isGitHubReady(): boolean {
    return this.githubService !== null && this.githubService.isReady();
  }

  // 订阅进度更新
  onProgress(callback: ProgressCallback): void {
    this.progressCallbacks.push(callback);
  }

  // 发送进度更新
  private emitProgress(progress: WorkflowProgress): void {
    this.progressCallbacks.forEach((cb) => cb(progress));
  }

  // 执行单个Agent任务
  private async executeSingleTask(
    workflowId: string,
    task: AgentTask,
    previousResults: Map<string, AgentTaskResult>
  ): Promise<AgentTaskResult> {
    if (!this.zhipuService) {
      return {
        success: false,
        content: '',
        error: '智谱AI服务未配置',
      };
    }

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

      // 执行Agent任务
      const request: AgentTaskRequest = {
        agentRole: task.agentRole,
        agentName: task.agentId,
        taskDescription: task.description,
        context: task.context,
        previousResults: previousResultsArray.length > 0 ? previousResultsArray : undefined,
      };

      const result = await this.zhipuService.executeAgentTask(request);

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

    // 定义新闻工作流的任务
    const tasks: AgentTask[] = [
      {
        id: 'research',
        agentId: 'researcher-1',
        agentRole: 'researcher',
        description: `研究并收集关于"${query}"的最新新闻和信息。请提供3-5条相关新闻的标题、摘要和来源。`,
        dependencies: [],
        context: `用户想了解关于: ${query}`,
      },
      {
        id: 'summarize',
        agentId: 'writer-1',
        agentRole: 'writer',
        description: `基于研究结果，撰写一份关于"${query}"的综合摘要报告。用中文撰写，约300字。`,
        dependencies: ['research'],
        context: '需要基于研究数据撰写摘要',
      },
      {
        id: 'translate',
        agentId: 'translator-1',
        agentRole: 'translator',
        description: `将中文摘要翻译成流畅的英文，保持专业术语的准确性。`,
        dependencies: ['summarize'],
        context: '将中文新闻摘要翻译成英文',
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

    return {
      original: summarizeResult?.content || '摘要生成失败',
      translated: translateResult?.content || '翻译失败',
      articles: articles.length > 0 ? articles : this.getMockArticles(),
    };
  }

  // 解析文章列表
  private parseArticles(content: string): NewsArticle[] {
    const articles: NewsArticle[] = [];
    const lines = content.split('\n');
    let currentArticle: Partial<NewsArticle> = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // 尝试匹配标题（通常以数字或-开头）
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
        // 尝试提取URL
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

  // 模拟文章（作为后备）
  private getMockArticles(): NewsArticle[] {
    return [
      {
        title: 'AI技术持续突破',
        description: '人工智能领域取得重大进展',
        url: 'https://example.com/news',
        publishedAt: new Date().toISOString(),
        source: 'AI News',
      },
    ];
  }

  // ==================== GitHub工作流 ====================
  async executeGitHubWorkflow(
    repoUrl: string,
    requirements: string,
    onProgress?: ProgressCallback,
    githubToken?: string
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

    // 如果提供了token，初始化GitHub服务
    if (githubToken && !this.isGitHubReady()) {
      this.setGitHubConfig({
        token: githubToken,
        owner: repoInfo.owner,
        repo: repoInfo.repo,
      });
    }

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
        const files = await this.githubService!.getRepositoryFiles();
        existingFiles = files.map(f => ({ path: f.path, content: f.content }));
        
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
        const result = await this.githubService!.commitChanges(
          changes,
          `AI Agent: ${requirements}`,
          `ai-update-${Date.now()}`
        );

        if (result.success && result.url) {
          commitResult = {
            branch: result.branch!,
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

export function getMultiAgentOrchestrator(apiKey?: string, model?: string): MultiAgentOrchestrator {
  if (!orchestratorInstance || apiKey) {
    orchestratorInstance = new MultiAgentOrchestrator(apiKey, model);
  }
  return orchestratorInstance;
}

export function resetMultiAgentOrchestrator(): void {
  orchestratorInstance = null;
}
