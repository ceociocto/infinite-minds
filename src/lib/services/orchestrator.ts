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
  ): Promise<{ success: boolean; changes: CodeChange[]; pullRequestUrl?: string; summary: string; deploymentResult?: DeploymentResult }> {
    if (onProgress) {
      this.onProgress(onProgress);
    }

    const workflowId = `github-${Date.now()}`;

    const repoMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    const repoInfo = repoMatch
      ? { owner: repoMatch[1], repo: repoMatch[2].replace('.git', '') }
      : { owner: 'unknown', repo: 'unknown' };

    const canCommitToGitHub = this.isGitHubReady();
    let existingFiles: { path: string; content: string }[] = [];
    const branchName = `ai-update-${Date.now()}`;

    this.emitProgress({
      workflowId,
      stepId: 'fetch-files',
      agentId: 'system',
      status: 'running',
      progress: 5,
      message: '📥 Fetching repository files...',
    });

    if (canCommitToGitHub) {
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
          progress: 10,
          message: `✅ Fetched ${existingFiles.length} files from repository`,
        });
      } catch (error) {
        this.emitProgress({
          workflowId,
          stepId: 'fetch-files',
          agentId: 'system',
          status: 'failed',
          progress: 10,
          message: `⚠️ Failed to fetch files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    const tasks: AgentTask[] = [
      {
        id: 'analyze',
        agentId: 'analyst-1',
        agentRole: 'analyst',
        description: `Analyze GitHub repository ${repoInfo.owner}/${repoInfo.repo} structure. Based on requirements "${requirements}", identify key files and code locations that need modification.`,
        dependencies: [],
        context: `Repository URL: ${repoUrl}\nRequirements: ${requirements}${existingFiles.length > 0 ? `\n\nExisting files:\n${existingFiles.slice(0, 10).map(f => `- ${f.path}`).join('\n')}` : ''}`,
      },
      {
        id: 'develop',
        agentId: 'dev-1',
        agentRole: 'developer',
        description: `Based on analysis, write code modifications for repository ${repoInfo.owner}/${repoInfo.repo}. Implement requirements: "${requirements}". Provide complete file contents.`,
        dependencies: ['analyze'],
        context: `Repository: ${repoUrl}${existingFiles.length > 0 ? `\n\nReference existing files:\n${existingFiles.slice(0, 5).map(f => `\n=== ${f.path} ===\n${f.content.substring(0, 1000)}...`).join('\n')}` : ''}`,
      },
      {
        id: 'review',
        agentId: 'pm-1',
        agentRole: 'pm',
        description: `Review code changes to ensure requirements "${requirements}" are met. Generate deployment plan summary.`,
        dependencies: ['develop'],
        context: 'Review completed code modifications',
      },
    ];

    const results = await this.executeWorkflow(workflowId, tasks);
    const changes = this.parseCodeChanges(results.get('develop')?.content || '');

    this.emitProgress({
      workflowId,
      stepId: 'create-branch',
      agentId: 'system',
      status: 'running',
      progress: 40,
      message: `🌿 Creating branch: ${branchName}`,
    });

    let prNumber: number | undefined;
    let commitResult: { branch: string; url: string } | undefined;

    if (canCommitToGitHub && changes.length > 0) {
      try {
        const createBranchResponse = await fetch('/api/github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'createBranch',
            owner: repoInfo.owner,
            repo: repoInfo.repo,
            branchName,
            baseBranch: 'main',
          }),
        });

        if (createBranchResponse.ok) {
          this.emitProgress({
            workflowId,
            stepId: 'create-branch',
            agentId: 'system',
            status: 'completed',
            progress: 45,
            message: `✅ Branch created: ${branchName}`,
          });
        } else {
          throw new Error('Failed to create branch');
        }

        this.emitProgress({
          workflowId,
          stepId: 'commit-files',
          agentId: 'system',
          status: 'running',
          progress: 45,
          message: `📝 Committing ${changes.length} file(s)...`,
        });

        const commitStartProgress = 45;
        const commitProgressPerFile = 35 / changes.length;

        for (let i = 0; i < changes.length; i++) {
          const change = changes[i];
          const currentProgress = Math.round(
            commitStartProgress + (i + 1) * commitProgressPerFile
          );

          this.emitProgress({
            workflowId,
            stepId: `commit-file-${i}`,
            agentId: 'system',
            status: 'running',
            progress: currentProgress,
            message: `📄 Committing file ${i + 1}/${changes.length}: ${change.path}`,
          });

          const fileResponse = await fetch('/api/github', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'commit',
              owner: repoInfo.owner,
              repo: repoInfo.repo,
              changes: [change],
              message: `AI: ${change.action} ${change.path}`,
              branchName,
            }),
          });

          if (!fileResponse.ok) {
            throw new Error(`Failed to commit file: ${change.path}`);
          }

          this.emitProgress({
            workflowId,
            stepId: `commit-file-${i}`,
            agentId: 'system',
            status: 'completed',
            progress: currentProgress,
            message: `✅ Committed: ${change.path}`,
          });
        }

        this.emitProgress({
          workflowId,
          stepId: 'commit-files',
          agentId: 'system',
          status: 'completed',
          progress: 80,
          message: `✅ All ${changes.length} file(s) committed`,
        });

        this.emitProgress({
          workflowId,
          stepId: 'create-pr',
          agentId: 'system',
          status: 'running',
          progress: 80,
          message: '🔀 Creating pull request...',
        });

        const prResponse = await fetch('/api/github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'createPR',
            owner: repoInfo.owner,
            repo: repoInfo.repo,
            title: `AI Agent: ${requirements}`,
            body: `Automated changes by AI Agent\n\n**Requirements:**\n${requirements}\n\n**Changes:**\n${changes.map(c => `- ${c.action}: ${c.path}`).join('\n')}`,
            head: branchName,
            base: 'main',
          }),
        });

        if (prResponse.ok) {
          const prData = await prResponse.json();
          prNumber = prData.pullRequest.number;
          commitResult = {
            branch: branchName,
            url: prData.pullRequest.url,
          };

          this.emitProgress({
            workflowId,
            stepId: 'create-pr',
            agentId: 'system',
            status: 'completed',
            progress: 85,
            message: `✅ Pull request created: #${prNumber}`,
            result: commitResult.url,
          });
        } else {
          throw new Error('Failed to create pull request');
        }

        if (prNumber) {
          this.emitProgress({
            workflowId,
            stepId: 'monitor-deployment',
            agentId: 'system',
            status: 'running',
            progress: 85,
            message: '🚀 Monitoring GitHub Actions deployment...',
          });

          try {
            const deploymentResult = await this.monitorDeployment(
              repoInfo.owner,
              repoInfo.repo,
              branchName,
              workflowId
            );

            if (deploymentResult.success) {
              this.emitProgress({
                workflowId,
                stepId: 'monitor-deployment',
                agentId: 'system',
                status: 'completed',
                progress: 95,
                message: `✅ Deployment successful (${deploymentResult.duration}s)`,
                result: deploymentResult.workflowUrl,
              });

              this.emitProgress({
                workflowId,
                stepId: 'merge-pr',
                agentId: 'system',
                status: 'running',
                progress: 95,
                message: '🔀 Auto-merging pull request...',
              });

              const mergeResponse = await fetch('/api/github', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'mergePR',
                  owner: repoInfo.owner,
                  repo: repoInfo.repo,
                  prNumber,
                  options: {
                    method: 'merge',
                  },
                }),
              });

              if (mergeResponse.ok) {
                const mergeData = await mergeResponse.json();
                deploymentResult.merged = mergeData.merge.merged;
                deploymentResult.mergedAt = new Date().toISOString();

                this.emitProgress({
                  workflowId,
                  stepId: 'merge-pr',
                  agentId: 'system',
                  status: 'completed',
                  progress: 100,
                  message: `✅ PR merged successfully`,
                });
              } else {
                this.emitProgress({
                  workflowId,
                  stepId: 'merge-pr',
                  agentId: 'system',
                  status: 'failed',
                  progress: 95,
                  message: `⚠️ Auto-merge failed (manual merge required)`,
                });
              }

              return {
                success: results.get('develop')?.success || false,
                changes: changes.length > 0 ? changes : this.getMockChanges(),
                pullRequestUrl: commitResult?.url,
                summary: results.get('review')?.content || 'Code modification complete',
                deploymentResult,
              };
            } else {
              this.emitProgress({
                workflowId,
                stepId: 'monitor-deployment',
                agentId: 'system',
                status: 'failed',
                progress: 95,
                message: `❌ Deployment failed: ${deploymentResult.status}`,
              });

              return {
                success: false,
                changes,
                pullRequestUrl: commitResult?.url,
                summary: results.get('review')?.content || 'Code modification complete',
                deploymentResult,
              };
            }
          } catch (error) {
            this.emitProgress({
              workflowId,
              stepId: 'monitor-deployment',
              agentId: 'system',
              status: 'failed',
              progress: 95,
              message: `⚠️ Deployment monitoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });

            return {
              success: results.get('develop')?.success || false,
              changes,
              pullRequestUrl: commitResult?.url,
              summary: results.get('review')?.content || 'Code modification complete',
            };
          }
        }
      } catch (error) {
        console.error('GitHub operation failed:', error);
        this.emitProgress({
          workflowId,
          stepId: 'github-error',
          agentId: 'system',
          status: 'failed',
          progress: 0,
          message: `❌ GitHub operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });

        return {
          success: false,
          changes,
          summary: results.get('review')?.content || 'Operation failed',
        };
      }
    }

    return {
      success: results.get('develop')?.success || false,
      changes: changes.length > 0 ? changes : this.getMockChanges(),
      summary: results.get('review')?.content || 'Code modification complete (not committed)',
    };
  }

  private async monitorDeployment(
    owner: string,
    repo: string,
    branch: string,
    workflowId: string,
    timeout: number = 15 * 60 * 1000
  ): Promise<DeploymentResult> {
    const startTime = Date.now();
    let lastRunId: number | null = null;
    let pollCount = 0;
    const maxPolls = Math.ceil(timeout / 10000);

    while (pollCount < maxPolls) {
      pollCount++;

      try {
        const response = await fetch('/api/github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'listWorkflowRuns',
            owner,
            repo,
            branch,
            perPage: 5,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const runs: GitHubWorkflowRun[] = data.runs || [];

          const recentRun = runs.find(r => 
            r.id > (lastRunId || 0) && 
            r.created_at >= new Date(startTime).toISOString()
          );

          if (recentRun) {
            lastRunId = recentRun.id;

            this.emitProgress({
              workflowId,
              stepId: 'monitor-deployment',
              agentId: 'system',
              status: 'running',
              progress: Math.min(85 + Math.floor(pollCount / maxPolls * 10), 95),
              message: `🔄 Workflow ${recentRun.name}: ${recentRun.status}`,
              result: recentRun.html_url,
            });

            if (recentRun.status === 'completed' && recentRun.conclusion === 'success') {
              return {
                success: true,
                workflowRunId: recentRun.id,
                workflowUrl: recentRun.html_url,
                status: 'success',
                merged: false,
                duration: Math.round((Date.now() - startTime) / 1000),
              };
            } else if (recentRun.status === 'failure' || recentRun.conclusion === 'failure') {
              return {
                success: false,
                workflowRunId: recentRun.id,
                workflowUrl: recentRun.html_url,
                status: recentRun.conclusion || 'failure',
                merged: false,
              };
            }
          }
        }

        await new Promise(resolve => setTimeout(resolve, 10000));
      } catch (error) {
        console.error('Polling error:', error);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    throw new Error('Deployment monitoring timeout');
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