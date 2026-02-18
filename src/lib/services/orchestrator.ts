// Multi-Agent Orchestrator
// Multi-Agent Collaboration Orchestration System - Client version (calls server API)

import type { AgentRole, NewsArticle, NewsSummary, CodeChange, GitHubWorkflowRun, GitHubWorkflowJob, GitHubWorkflowStep, WorkflowDetailedStatus, DeploymentResult, GitHubTokenConfig } from '@/types';

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

  // Set GitHub configuration
  setGitHubConfig(config: GitHubTokenConfig): void {
    this.githubConfig = config;
  }

  // Check if API service is ready（现在总是返回true，因为由服务端处理）
  isReady(): boolean {
    return true;
  }

  // Check if GitHub service is ready
  isGitHubReady(): boolean {
    return this.githubConfig !== null && !!this.githubConfig.token;
  }

  // Subscribe to progress updates
  onProgress(callback: ProgressCallback): void {
    this.progressCallbacks.push(callback);
  }

  // Emit progress updates
  private emitProgress(progress: WorkflowProgress): void {
    this.progressCallbacks.forEach((cb) => cb(progress));
  }

  // Call server AI API
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

  // Execute single agent task
  private async executeSingleTask(
    workflowId: string,
    task: AgentTask,
    previousResults: Map<string, AgentTaskResult>
  ): Promise<AgentTaskResult> {
    // Emit start progress
    this.emitProgress({
      workflowId,
      stepId: task.id,
      agentId: task.agentId,
      status: 'running',
      progress: 0,
      message: `${task.agentId} Started task execution:: ${task.description}`,
    });

    try {
      // Build previous results context
      const previousResultsArray: string[] = [];
      task.dependencies.forEach((depId) => {
        const depResult = previousResults.get(depId);
        if (depResult?.success) {
          previousResultsArray.push(depResult.content);
        }
      });

      // Call server API to execute agent task
      const result = await this.callAIAPI({
        agentRole: task.agentRole,
        agentName: task.agentId,
        taskDescription: task.description,
        context: task.context,
        previousResults: previousResultsArray.length > 0 ? previousResultsArray : undefined,
      });

      // Emit completion progress
      this.emitProgress({
        workflowId,
        stepId: task.id,
        agentId: task.agentId,
        status: result.success ? 'completed' : 'failed',
        progress: 100,
        message: result.success
          ? `${task.agentId} Completed task`
          : `${task.agentId} Task failed:: ${result.error}`,
        result: result.success ? result.content : undefined,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Emit failure progress
      this.emitProgress({
        workflowId,
        stepId: task.id,
        agentId: task.agentId,
        status: 'failed',
        progress: 0,
        message: `${task.agentId} Task failed:: ${errorMessage}`,
      });

      return {
        success: false,
        content: '',
        error: errorMessage,
      };
    }
  }

  // Execute workflow (supports dependencies)
  async executeWorkflow(
    workflowId: string,
    tasks: AgentTask[]
  ): Promise<Map<string, AgentTaskResult>> {
    const results = new Map<string, AgentTaskResult>();
    const pendingTasks = new Map(tasks.map((t) => [t.id, t]));
    const completedTasks = new Set<string>();
    const totalTasks = tasks.length;

    // Emit initial progress
    this.emitProgress({
      workflowId,
      stepId: 'workflow',
      agentId: 'system',
      status: 'running',
      progress: 0,
      message: 'Workflow started',
    });

    // Check if dependencies are met
    const areDependenciesMet = (task: AgentTask): boolean => {
      return task.dependencies.every((depId) => completedTasks.has(depId));
    };

    // Execute a batch of tasks
    const executeBatch = async () => {
      const readyTasks: AgentTask[] = [];

      // Find all tasks with dependencies met
      pendingTasks.forEach((task) => {
        if (areDependenciesMet(task)) {
          readyTasks.push(task);
        }
      });

      // Remove ready tasks from pending list
      readyTasks.forEach((task) => pendingTasks.delete(task.id));

      // Execute all ready tasks in parallel
      const taskPromises = readyTasks.map(async (task) => {
        const result = await this.executeSingleTask(workflowId, task, results);
        results.set(task.id, result);
        completedTasks.add(task.id);
        
        // Emit overall progress update
        const overallProgress = Math.round((completedTasks.size / totalTasks) * 100);
        this.emitProgress({
          workflowId,
          stepId: 'workflow',
          agentId: task.agentId,
          status: 'running',
          progress: overallProgress,
          message: `Task progress:: ${completedTasks.size}/${totalTasks} (${overallProgress}%)`,
        });
      });

      await Promise.all(taskPromises);
    };

    // Loop execution until all tasks completed
    while (pendingTasks.size > 0) {
      const previousCompletedCount = completedTasks.size;
      await executeBatch();

      // Check if there is progress
      if (completedTasks.size === previousCompletedCount && pendingTasks.size > 0) {
        // There may be circular dependencies or unexecutable tasks
        const remainingTasks = Array.from(pendingTasks.values());
        remainingTasks.forEach((task) => {
          results.set(task.id, {
            success: false,
            content: '',
            error: 'Dependency not met or circular dependency',
          });
          this.emitProgress({
            workflowId,
            stepId: task.id,
            agentId: task.agentId,
            status: 'failed',
            progress: 0,
            message: `${task.agentId} Cannot execute: dependencies not met`,
          });
        });
        break;
      }
    }

    // Emit completion progress
    this.emitProgress({
      workflowId,
      stepId: 'workflow',
      agentId: 'system',
      status: 'completed',
      progress: 100,
      message: 'Workflow execution completed',
    });

    this.workflowResults.set(workflowId, results);
    return results;
  }

  // ==================== News Workflow ====================
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

    // Execute workflow
    const results = await this.executeWorkflow(workflowId, tasks);

    // Parse results
    const researchResult = results.get('research');
    const summarizeResult = results.get('summarize');
    const translateResult = results.get('translate');

    // Parse research results to article list
    const articles = this.parseArticles(researchResult?.content || '');

    // Check if all tasks failed（indicating AI service not configured）
    const allFailed = !researchResult?.success && !summarizeResult?.success && !translateResult?.success;

    if (allFailed) {
      throw new Error('AI service not configured or call failed. Please set ZHIPU_API_KEY in Cloudflare Workers environment variables.');
    }

    return {
      original: summarizeResult?.content || 'Summary generation failed',
      translated: translateResult?.content || 'Translation failed',
      articles: articles.length > 0 ? articles : [], // Do not use mock data
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

  // ==================== GitHub Workflow (OpenCode Integration) ====================
  async executeGitHubWorkflow(
    repoUrl: string,
    requirements: string,
    onProgress?: ProgressCallback
  ): Promise<{ success: boolean; changes: CodeChange[]; pullRequestUrl?: string; summary: string; deploymentResult?: DeploymentResult }> {
    if (onProgress) {
      this.onProgress(onProgress);
    }

    const workflowId = `github-${Date.now()}`;

    // Parse repository info
    const repoMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    const repoInfo = repoMatch
      ? { owner: repoMatch[1], repo: repoMatch[2].replace('.git', '') }
      : { owner: 'ceociocto', repo: 'investment-advisor' }; // 默认值

    try {
      // ========== Step 1: PM Agent 分析任务 ==========
      this.emitProgress({
        workflowId,
        stepId: 'analyze-task',
        agentId: 'pm-1',
        status: 'running',
        progress: 5,
        message: '📋 Analyzing task requirements...',
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
        throw new Error(`Task analysis failed:: ${analysisResult.error}`);
      }

      this.emitProgress({
        workflowId,
        stepId: 'analyze-task',
        agentId: 'pm-1',
        status: 'completed',
        progress: 15,
        message: '✅ Task analysis completed',
        result: analysisResult.content,
      });

      // ========== Step 2: Trigger OpenCode Workflow ==========
      this.emitProgress({
        workflowId,
        stepId: 'trigger-workflow',
        agentId: 'system',
        status: 'running',
        progress: 20,
        message: `🚀 触发 OpenCode workflow in ${repoInfo.owner}/${repoInfo.repo}...`,
      });

      // 构建完整的 taskDescription，包含仓库上下文和明确的主任务
      const taskDescription = `修改当前仓库 ${repoInfo.owner}/${repoInfo.repo}

主任务: ${requirements}

上下文信息:
- 这是从 infinite-minds 系统触发的任务
- 目标仓库: ${repoInfo.owner}/${repoInfo.repo}
- 当前仓库已检出，可以直接修改
- 不需要克隆其他仓库

请直接修改当前检出的仓库代码。`;

      // 创建 Issue 来记录需求并触发 OpenCode（通过 issue_comment 事件）
      const issueResponse = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createOpenCodeIssue',
          owner: repoInfo.owner,
          repo: repoInfo.repo,
          taskDescription: taskDescription,
          requirements: analysisResult.content,
          source: 'infinite-minds',
        }),
      });

      if (!issueResponse.ok) {
        const errorData = await issueResponse.json();
        throw new Error(errorData.error || '创建 OpenCode Issue 失败');
      }

      const issueData = await issueResponse.json();

      if (!issueData.success) {
        throw new Error(issueData.error || '创建 OpenCode Issue 失败');
      }
      
      this.emitProgress({
        workflowId,
        stepId: 'trigger-workflow',
        agentId: 'system',
        status: 'completed',
        progress: 25,
        message: `✅ OpenCode Issue 已创建 (#${issueData.issueNumber})`,
        result: issueData.issueUrl,
      });

      // ========== Step 3: Waiting for OpenCode execution完成 ==========
      this.emitProgress({
        workflowId,
        stepId: 'wait-opencode',
        agentId: 'system',
        status: 'running',
        progress: 30,
        message: '⏳ 等待 OpenCode workflow 执行中...',
      });

      // Issue 已创建，OpenCode 将通过 issue_comment 事件自动触发
      // 等待 workflow 执行并持续监测状态
      const triggeredAt = new Date().toISOString();
      const openCodeResult = await this.waitForOpenCodeCompletion(
        repoInfo.owner,
        repoInfo.repo,
        workflowId,
        issueData.issueUrl
      );

      // ========== Step 4: 获取 Pull Request ==========
      let pullRequest: { url: string; number: number } | null = null;
      
      if (openCodeResult.success) {
        this.emitProgress({
          workflowId,
          stepId: 'get-pr',
          agentId: 'system',
          status: 'running',
          progress: 95,
          message: '🔍 查找 OpenCode 创建的 Pull Request...',
        });

        // 等待几秒让 PR 创建完成
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        pullRequest = await this.getOpenCodePullRequest(
          repoInfo.owner,
          repoInfo.repo,
          triggeredAt
        );

        if (pullRequest) {
          this.emitProgress({
            workflowId,
            stepId: 'get-pr',
            agentId: 'system',
            status: 'completed',
            progress: 98,
            message: `✅ Pull Request 已创建: #${pullRequest.number}`,
            result: pullRequest.url,
          });
        }
      }

      // ========== Step 5: 完成 ==========
      const isSuccess = openCodeResult.success;
      const finalMessage = isSuccess
        ? `✅ 任务完成! ${pullRequest ? `[查看 PR](${pullRequest.url})` : '[查看 Issue](' + issueData.issueUrl + ')'}`
        : `❌ 任务失败: ${openCodeResult.error}`;

      this.emitProgress({
        workflowId,
        stepId: 'complete',
        agentId: 'system',
        status: isSuccess ? 'completed' : 'failed',
        progress: 100,
        message: finalMessage,
        result: {
          issueUrl: issueData.issueUrl,
          workflowRunId: openCodeResult.runId,
          workflowUrl: openCodeResult.logsUrl,
          pullRequestUrl: pullRequest?.url,
          duration: openCodeResult.duration,
        },
      });

      return {
        success: isSuccess,
        changes: [], // OpenCode 直接在目标仓库创建 PR
        pullRequestUrl: pullRequest?.url,
        summary: analysisResult.content,
        deploymentResult: {
          success: isSuccess,
          workflowRunId: openCodeResult.runId,
          workflowUrl: openCodeResult.logsUrl || issueData.issueUrl,
          status: isSuccess ? 'completed' : 'failed',
          merged: false,
          pullRequestUrl: pullRequest?.url,
          duration: openCodeResult.duration,
        },
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // 根据错误类型提供具体的Solution:
      let detailedMessage = `❌ Operation failed:: ${errorMessage}`;
      
      if (errorMessage.includes('Not Found')) {
        detailedMessage += '\n\n💡 Solution:：\n' +
          '1. 1. Please confirm the repository name is correct\n' +
          '2. 2. Confirm the repository exists and you have access';
      } else if (errorMessage.includes('workflow')) {
        detailedMessage += '\n\n💡 Solution:：\n' +
          '1. 1. Check if OpenCode App is installed\n' +
          '2. 2. Confirm .github/workflows/opencode-agent.yml exists\n' +
          '3. 3. Check if workflow is enabled';
      } else if (errorMessage.includes('resource not accessible')) {
        detailedMessage += '\n\n💡 Solution:：\n' +
          '1. 1. Check if GITHUB_TOKEN is configured correctly\n' +
          '2. 2. Confirm infinite-minds account is a collaborator';
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
   * Wait for OpenCode workflow execution to complete
   */
  private async waitForOpenCodeCompletion(
    owner: string,
    repo: string,
    workflowId: string,
    triggeredWorkflowUrl: string,
    timeout: number = 30 * 60 * 1000 // 30 minutes
  ): Promise<{
    success: boolean;
    runId?: number;
    completedAt?: string;
    duration?: number;
    error?: string;
    logsUrl?: string;
  }> {
    const startTime = Date.now();
    const POLL_INTERVAL = 5000; // 5 second polling
    const maxPolls = Math.ceil(timeout / POLL_INTERVAL);
    let pollCount = 0;
    let lastRunId: number | null = null;
    let foundWorkflow = false;

    while (pollCount < maxPolls) {
      pollCount++;

      try {
        // Get the latest workflow runs
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
          throw new Error('Failed to get workflow runs');
        }

        const data = await response.json();
        const runs: GitHubWorkflowRun[] = data.runs || [];

        // Find the latest OpenCode workflow run
        const openCodeRun = runs.find((r: GitHubWorkflowRun & { created_at: string; html_url: string }) => {
          const runCreatedAt = new Date(r.created_at).getTime();
          const isRecent = runCreatedAt >= startTime - 60000; // Allow 1 minute buffer
          const isCorrectWorkflow = r.name === 'OpenCode Agent' ||
                                  r.name?.toLowerCase().includes('opencode') ||
                                  r.name?.toLowerCase().includes('agent');
          return isRecent && isCorrectWorkflow;
        });

        if (openCodeRun) {
          if (!foundWorkflow) {
            foundWorkflow = true;
            this.emitProgress({
              workflowId,
              stepId: 'wait-opencode',
              agentId: 'system',
              status: 'running',
              progress: 35,
              message: `🚀 Workflow 已触发: ${openCodeRun.name}`,
              result: {
                workflowUrl: openCodeRun.html_url,
                logsUrl: `https://github.com/${owner}/${repo}/actions/runs/${openCodeRun.id}`,
              },
            });
          }

          if (openCodeRun.id !== lastRunId || openCodeRun.status !== 'completed') {
            lastRunId = openCodeRun.id;

            // Get detailed status including jobs and steps
            const detailedStatus = await this.getWorkflowDetailedStatus(owner, repo, openCodeRun.id);

            // Build detailed progress message
            let progressMessage = '🔄 OpenCode 正在运行中...';
            let progress = 35 + Math.round((detailedStatus.progress / 100) * 55); // 35-90% range

            // 检查是否有失败的 job 或 step
            const failedJob = detailedStatus.jobs.find((j: GitHubWorkflowJob) => j.conclusion === 'failure');
            const failedStep = failedJob?.steps.find((s: GitHubWorkflowStep) => s.conclusion === 'failure');

            if (failedStep) {
              progressMessage = `❌ ${failedJob?.name} → ${failedStep.name} 失败`;
              progress = detailedStatus.progress;
            } else if (detailedStatus.currentJob) {
              progressMessage = `📦 ${detailedStatus.currentJob.name}`;

              if (detailedStatus.currentStep) {
                progressMessage += ` → ${detailedStatus.currentStep.name}`;
              }

              // Show step progress within the job
              if (detailedStatus.currentJob.steps.length > 0) {
                const completedSteps = detailedStatus.currentJob.steps.filter(
                  (s: { status: string }) => s.status === 'completed'
                ).length;
                progressMessage += ` (${completedSteps}/${detailedStatus.currentJob.steps.length})`;
              }
            } else if (detailedStatus.jobs.length > 0) {
              // Show completed jobs summary
              const completedJobs = detailedStatus.jobs.filter((j: GitHubWorkflowJob) => j.status === 'completed').length;
              if (completedJobs === detailedStatus.jobs.length) {
                progressMessage = '✅ 所有 job 执行完成';
                progress = 90;
              } else {
                progressMessage = `⏳ ${completedJobs}/${detailedStatus.jobs.length} jobs 完成`;
              }
            }

            // Emit progress with detailed information
            this.emitProgress({
              workflowId,
              stepId: 'wait-opencode',
              agentId: 'system',
              status: openCodeRun.status === 'completed' ? 'completed' : 'running',
              progress,
              message: progressMessage,
              result: {
                workflowUrl: openCodeRun.html_url,
                logsUrl: `https://github.com/${owner}/${repo}/actions/runs/${openCodeRun.id}`,
                status: openCodeRun.status,
                conclusion: openCodeRun.conclusion,
                jobs: detailedStatus.jobs,
                currentJob: detailedStatus.currentJob,
                currentStep: detailedStatus.currentStep,
                progress: detailedStatus.progress,
              },
            });

            // Check if completed
            if (openCodeRun.status === 'completed') {
              const duration = Math.round((Date.now() - startTime) / 1000);

              if (openCodeRun.conclusion === 'success') {
                return {
                  success: true,
                  runId: openCodeRun.id,
                  completedAt: openCodeRun.updated_at,
                  duration,
                  logsUrl: `https://github.com/${owner}/${repo}/actions/runs/${openCodeRun.id}`,
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
        } else if (pollCount % 6 === 0) {
          // Update waiting message every 30 seconds
          const elapsedMinutes = Math.round((Date.now() - startTime) / 60000);
          this.emitProgress({
            workflowId,
            stepId: 'wait-opencode',
            agentId: 'system',
            status: 'running',
            progress: 30 + Math.min(pollCount * 0.5, 10),
            message: `⏳ 等待 OpenCode workflow 启动中... (${elapsedMinutes} 分钟)`,
          });
        }

        // Wait for next poll
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

      } catch (error) {
        console.error('Polling error:', error);
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
      }
    }

    throw new Error(`OpenCode workflow 执行超时 (${Math.round(timeout / 60000)} 分钟)`);
  }

  /**
   * Get detailed workflow status including jobs and steps
   */
  private async getWorkflowDetailedStatus(
    owner: string,
    repo: string,
    runId: number
  ): Promise<WorkflowDetailedStatus> {
    const response = await fetch('/api/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getWorkflowDetailedStatus',
        owner,
        repo,
        runId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get detailed workflow status');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get detailed workflow status');
    }

    return data;
  }

  /**
   * 获取 OpenCode created Pull Request
   */
  private async getOpenCodePullRequest(
    owner: string,
    repo: string,
    afterDate: string
  ): Promise<{ url: string; number: number } | null> {
    try {
      // Wait for PR to be created
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

      // Find recently created PR（created by OpenCode）
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const openCodePR = pullRequests.find((pr: any) => {
        const createdAt = new Date(pr.created_at);
        const createdAfter = new Date(afterDate);
        const isRecent = createdAt >= createdAfter;
        
        // Identify by PR title or content
        const isOpenCodePR = pr.title?.toLowerCase().includes('ai') ||
                              pr.title?.toLowerCase().includes('opencode') ||
                              pr.body?.toLowerCase().includes('opencode') ||
                              pr.user?.type === 'Bot';

        return isRecent && isOpenCodePR;
      });

      return openCodePR ? { url: openCodePR.html_url, number: openCodePR.number } : null;

    } catch (error) {
      console.error('Failed to get PR::', error);
      return null;
    }
  }

  // ==================== General Task Workflow ====================
  async executeGeneralWorkflow(
    taskDescription: string,
    onProgress?: ProgressCallback
  ): Promise<{ success: boolean; result: string; tasksCompleted: number }> {
    if (onProgress) {
      this.onProgress(onProgress);
    }

    const workflowId = `general-${Date.now()}`;

    // PM analyzes task and plans
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
        result: 'Task planning failed:: ' + planResult.error,
        tasksCompleted: 0,
      };
    }

    // Based on PM analysis, dynamically create agent tasks
    // Simplified: use researcher and writer combination
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
      result: executeResult?.content || '任务execution failed:',
      tasksCompleted: Array.from(results.values()).filter((r) => r.success).length,
    };
  }

  // ==================== Development Task Workflow ====================
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
        result: 'Code generation failed:: ' + (developResult?.error || 'Unknown error'),
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