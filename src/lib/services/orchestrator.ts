// Multi-Agent Orchestrator
// 多Agent协作编排系统 - 客户端版本（调用服务端API）

import type { AgentRole, NewsArticle, NewsSummary, CodeChange, GitHubWorkflowRun, DeploymentResult, GitHubTokenConfig } from '@/types';

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
  private githubConfig: GitHubTokenConfig | null = null;

  constructor() {}

  // 设置GitHub配置
  setGitHubConfig(config: GitHubTokenConfig): void {
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
    const totalTasks = tasks.length;

    // 发送初始进度
    this.emitProgress({
      workflowId,
      stepId: 'workflow',
      agentId: 'system',
      status: 'running',
      progress: 0,
      message: '工作流开始执行',
    });

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
        
        // 发送整体进度更新
        const overallProgress = Math.round((completedTasks.size / totalTasks) * 100);
        this.emitProgress({
          workflowId,
          stepId: 'workflow',
          agentId: task.agentId,
          status: 'running',
          progress: overallProgress,
          message: `任务进度: ${completedTasks.size}/${totalTasks} (${overallProgress}%)`,
        });
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

    // 发送完成进度
    this.emitProgress({
      workflowId,
      stepId: 'workflow',
      agentId: 'system',
      status: 'completed',
      progress: 100,
      message: '工作流执行完成',
    });

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
      throw new Error('AI service not configured or call failed. Please set ZHIPU_API_KEY in Cloudflare Workers environment variables.');
    }

    return {
      original: summarizeResult?.content || 'Summary generation failed',
      translated: translateResult?.content || 'Translation failed',
      articles: articles.length > 0 ? articles : [], // 不使用模拟数据
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

  // ==================== GitHub工作流 (OpenCode集成) ====================
  async executeGitHubWorkflow(
    repoUrl: string,
    requirements: string,
    onProgress?: ProgressCallback
  ): Promise<{ success: boolean; changes: CodeChange[]; pullRequestUrl?: string; summary: string; deploymentResult?: DeploymentResult }> {
    if (onProgress) {
      this.onProgress(onProgress);
    }

    const workflowId = `github-${Date.now()}`;

    // 解析仓库信息
    const repoMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    const repoInfo = repoMatch
      ? { owner: repoMatch[1], repo: repoMatch[2].replace('.git', '') }
      : { owner: 'ceociocto', repo: 'investment-advisor' }; // 默认值

    try {
      // ========== 步骤 1: PM Agent 分析任务 ==========
      this.emitProgress({
        workflowId,
        stepId: 'analyze-task',
        agentId: 'pm-1',
        status: 'running',
        progress: 5,
        message: '📋 分析任务需求...',
      });

      const analysisResult = await this.callAIAPI({
        agentRole: 'pm',
        agentName: 'pm-1',
        taskDescription: `分析以下 GitHub 仓库修改任务:\n` +
          `仓库: ${repoInfo.owner}/${repoInfo.repo}\n` +
          `需求: ${requirements}\n\n` +
          `请分析:\n` +
          `1. 这个需求的核心目标是什么？\n` +
          `2. 需要修改哪些文件？\n` +
          `3. 实施步骤是什么？\n\n` +
          `输出简洁的分析报告。`,
      });

      if (!analysisResult.success) {
        throw new Error(`任务分析失败: ${analysisResult.error}`);
      }

      this.emitProgress({
        workflowId,
        stepId: 'analyze-task',
        agentId: 'pm-1',
        status: 'completed',
        progress: 15,
        message: '✅ 任务分析完成',
        result: analysisResult.content,
      });

      // ========== 步骤 2: 触发 OpenCode Workflow ==========
      this.emitProgress({
        workflowId,
        stepId: 'trigger-workflow',
        agentId: 'system',
        status: 'running',
        progress: 20,
        message: `🚀 触发 OpenCode workflow in ${repoInfo.owner}/${repoInfo.repo}...`,
      });

      const triggerResponse = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'triggerOpenCode',
          owner: repoInfo.owner,
          repo: repoInfo.repo,
          taskDescription: requirements,
          requirements: analysisResult.content,
        }),
      });

      if (!triggerResponse.ok) {
        const errorData = await triggerResponse.json();
        throw new Error(errorData.error || '触发 OpenCode workflow 失败');
      }

      const triggerData = await triggerResponse.json();

      if (!triggerData.success) {
        throw new Error(triggerData.error || '触发 OpenCode workflow 失败');
      }
      
      this.emitProgress({
        workflowId,
        stepId: 'trigger-workflow',
        agentId: 'system',
        status: 'completed',
        progress: 25,
        message: `✅ OpenCode workflow 已触发`,
        result: triggerData.workflowUrl,
      });

      // ========== 步骤 3: 等待 OpenCode 执行完成 ==========
      this.emitProgress({
        workflowId,
        stepId: 'wait-opencode',
        agentId: 'system',
        status: 'running',
        progress: 30,
        message: '⏳ 等待 OpenCode 执行...',
      });

      // 轮询等待 workflow 完成（最多30分钟）
      const executionResult = await this.waitForOpenCodeCompletion(
        repoInfo.owner,
        repoInfo.repo,
        workflowId,
        triggerData.workflowUrl
      );

      if (!executionResult.success) {
        this.emitProgress({
          workflowId,
          stepId: 'wait-opencode',
          agentId: 'system',
          status: 'failed',
          progress: 0,
          message: `❌ OpenCode 执行失败: ${executionResult.error}`,
          result: {
            workflowUrl: triggerData.workflowUrl,
            logsUrl: executionResult.logsUrl,
          },
        });

        throw new Error(executionResult.error || 'OpenCode workflow 执行失败');
      }

      // ========== 步骤 4: 获取创建的 PR ==========
      this.emitProgress({
        workflowId,
        stepId: 'get-pr',
        agentId: 'system',
        status: 'running',
        progress: 90,
        message: '🔍 查找 OpenCode 创建的 Pull Request...',
      });

      const prInfo = await this.getOpenCodePullRequest(
        repoInfo.owner,
        repoInfo.repo,
        executionResult.completedAt || new Date().toISOString()
      );

      this.emitProgress({
        workflowId,
        stepId: 'complete',
        agentId: 'system',
        status: 'completed',
        progress: 100,
        message: prInfo 
          ? `✅ 代码修改完成！[查看 Pull Request](${prInfo.url})`
          : '✅ OpenCode 执行完成（未找到 PR）',
        result: prInfo?.url,
      });

      return {
        success: true,
        changes: [], // OpenCode 直接在目标仓库创建 PR，不返回代码变更
        pullRequestUrl: prInfo?.url,
        summary: analysisResult.content,
        deploymentResult: {
          success: true,
          workflowRunId: executionResult.runId,
          workflowUrl: triggerData.workflowUrl,
          status: 'success',
          merged: false,
          duration: executionResult.duration,
          pullRequestUrl: prInfo?.url,
        },
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      // 根据错误类型提供具体的解决方案
      let detailedMessage = `❌ 操作失败: ${errorMessage}`;
      
      if (errorMessage.includes('Not Found')) {
        detailedMessage += '\n\n💡 解决方案：\n' +
          '1. 请确认仓库名称正确\n' +
          '2. 确认仓库存在或您有访问权限';
      } else if (errorMessage.includes('workflow')) {
        detailedMessage += '\n\n💡 解决方案：\n' +
          '1. 检查 investment-advisor 是否已安装 OpenCode App\n' +
          '2. 确认 .github/workflows/opencode-agent.yml 存在\n' +
          '3. 检查 workflow 是否启用';
      } else if (errorMessage.includes('resource not accessible')) {
        detailedMessage += '\n\n💡 解决方案：\n' +
          '1. 检查 GITHUB_TOKEN 是否正确配置\n' +
          '2. 确认 infinite-minds 账号是 investment-advisor 的协作者';
      }
      
      this.emitProgress({
        workflowId,
        stepId: 'error',
        agentId: 'system',
        status: 'failed',
        progress: 0,
        message: detailedMessage,
      });

      throw new Error(errorMessage);
    }
  }

  /**
   * 等待 OpenCode workflow 执行完成
   */
  private async waitForOpenCodeCompletion(
    owner: string,
    repo: string,
    workflowId: string,
    triggeredWorkflowUrl: string,
    timeout: number = 30 * 60 * 1000 // 30分钟
  ): Promise<{ 
    success: boolean; 
    runId?: number; 
    completedAt?: string; 
    duration?: number; 
    error?: string;
    logsUrl?: string;
  }> {
    const startTime = Date.now();
    const POLL_INTERVAL = 3000; // 3秒轮询
    const maxPolls = Math.ceil(timeout / POLL_INTERVAL);
    let pollCount = 0;
    let lastRunId: number | null = null;

    while (pollCount < maxPolls) {
      pollCount++;

      try {
        // 获取最新的 workflow runs
        const response = await fetch('/api/github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'listWorkflowRuns',
            owner,
            repo,
            branch: 'main',
            perPage: 10,
          }),
        });

        if (!response.ok) {
          throw new Error('获取 workflow runs 失败');
        }

        const data = await response.json();
        const runs: GitHubWorkflowRun[] = data.runs || [];

        // 找到 OpenCode workflow 的最新运行
        const openCodeRun = runs.find((r: any) => {
          const isRecent = r.created_at >= new Date(startTime).toISOString();
          const isCorrectWorkflow = r.name === 'OpenCode Agent' || 
                                  r.name?.toLowerCase().includes('opencode');
          return isRecent && isCorrectWorkflow;
        });

        if (openCodeRun && openCodeRun.id !== lastRunId) {
          lastRunId = openCodeRun.id;

          const progressPercent = Math.min(30 + Math.floor((pollCount / maxPolls) * 60), 90);

          // 实时推送状态
          this.emitProgress({
            workflowId,
            stepId: 'wait-opencode',
            agentId: 'system',
            status: openCodeRun.status === 'completed' ? 'completed' : 'running',
            progress: progressPercent,
            message: `🔄 OpenCode: ${openCodeRun.status}${openCodeRun.conclusion ? ` (${openCodeRun.conclusion})` : ''}`,
            result: {
              workflowUrl: openCodeRun.html_url,
              logsUrl: `https://github.com/${owner}/${repo}/actions/runs/${openCodeRun.id}`,
              status: openCodeRun.status,
              conclusion: openCodeRun.conclusion,
            },
          });

          // 检查是否完成
          if (openCodeRun.status === 'completed') {
            const duration = Math.round((Date.now() - startTime) / 1000);

            if (openCodeRun.conclusion === 'success') {
              return {
                success: true,
                runId: openCodeRun.id,
                completedAt: openCodeRun.updated_at,
                duration,
              };
            } else {
              return {
                success: false,
                runId: openCodeRun.id,
                completedAt: openCodeRun.updated_at,
                duration,
                error: `OpenCode 执行失败: ${openCodeRun.conclusion}`,
                logsUrl: `https://github.com/${owner}/${repo}/actions/runs/${openCodeRun.id}`,
              };
            }
          }
        }

        // 等待下一次轮询
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

      } catch (error) {
        console.error('轮询错误:', error);
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
      }
    }

    throw new Error(`OpenCode workflow 执行超时（${Math.round(timeout / 60000)}分钟）`);
  }

  /**
   * 获取 OpenCode 创建的 Pull Request
   */
  private async getOpenCodePullRequest(
    owner: string,
    repo: string,
    afterDate: string
  ): Promise<{ url: string; number: number } | null> {
    try {
      // 等待一小段时间让 PR 被创建
      await new Promise(resolve => setTimeout(resolve, 5000));

      const response = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'listPullRequests',
          owner,
          repo,
          state: 'all',
          perPage: 10,
          sort: 'created',
          direction: 'desc',
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const pullRequests = data.pullRequests || [];

      // 找到最近创建的 PR（由 OpenCode 创建）
      const openCodePR = pullRequests.find((pr: any) => {
        const createdAt = new Date(pr.created_at);
        const createdAfter = new Date(afterDate);
        const isRecent = createdAt >= createdAfter;
        
        // 通过 PR 标题或内容判断
        const isOpenCodePR = pr.title?.toLowerCase().includes('ai') ||
                              pr.title?.toLowerCase().includes('opencode') ||
                              pr.body?.toLowerCase().includes('opencode') ||
                              pr.user?.type === 'Bot';

        return isRecent && isOpenCodePR;
      });

      return openCodePR ? { url: openCodePR.html_url, number: openCodePR.number } : null;

    } catch (error) {
      console.error('获取 PR 失败:', error);
      return null;
    }
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

  // ==================== 开发任务工作流 ====================
  async executeDevWorkflow(
    taskDescription: string,
    onProgress?: ProgressCallback
  ): Promise<{ success: boolean; result: string }> {
    if (onProgress) {
      this.onProgress(onProgress);
    }

    const workflowId = `dev-${Date.now()}`;

    const tasks: AgentTask[] = [
      {
        id: 'analyze',
        agentId: 'analyst-1',
        agentRole: 'analyst',
        description: `分析以下开发任务需求: "${taskDescription}"。分析需要创建/修改哪些文件，使用什么技术栈。`,
        dependencies: [],
        context: '开发需求分析',
      },
      {
        id: 'develop',
        agentId: 'dev-1',
        agentRole: 'developer',
        description: `实现以下开发任务: "${taskDescription}"。提供完整的代码实现，包括文件路径和代码内容。`,
        dependencies: ['analyze'],
        context: taskDescription,
      },
      {
        id: 'review',
        agentId: 'pm-1',
        agentRole: 'pm',
        description: `审查开发代码，确保符合 Next.js 15 App Router 规范和项目最佳实践。提供最终总结和部署建议。`,
        dependencies: ['develop'],
        context: '代码审查',
      },
    ];

    const results = await this.executeWorkflow(workflowId, tasks);
    const developResult = results.get('develop');
    const reviewResult = results.get('review');

    if (!developResult?.success) {
      return {
        success: false,
        result: '代码生成失败: ' + (developResult?.error || '未知错误'),
      };
    }

    const code = developResult.content;
    const review = reviewResult?.success ? reviewResult.content : '';

    return {
      success: true,
      result: `${code}\n\n${review ? '--- 代码审查 ---\n' + review : ''}`,
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