// GitHub Service - Real GitHub API Operations
// 真实的GitHub API操作服务

import { Octokit } from '@octokit/rest';
import type { CodeChange, GitHubWorkflowRun } from '@/types';

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export interface FileContent {
  path: string;
  content: string;
  sha?: string;
}

export interface CommitResult {
  success: boolean;
  commitSha?: string;
  branch?: string;
  url?: string;
  error?: string;
}

export class GitHubService {
  private octokit: Octokit | null = null;
  private config: GitHubConfig | null = null;

  constructor(config?: GitHubConfig) {
    if (config) {
      this.initialize(config);
    }
  }

  initialize(config: GitHubConfig): void {
    this.octokit = new Octokit({ auth: config.token });
    this.config = config;
  }

  isReady(): boolean {
    return this.octokit !== null && this.config !== null;
  }

  // 获取仓库文件列表
  async getRepositoryFiles(path: string = ''): Promise<FileContent[]> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub服务未初始化');
    }

    const { owner, repo } = this.config;
    
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
      });

      const files: FileContent[] = [];
      
      if (Array.isArray(data)) {
        // 目录
        for (const item of data) {
          if (item.type === 'file') {
            const content = await this.getFileContent(item.path);
            files.push({
              path: item.path,
              content: content || '',
              sha: item.sha,
            });
          } else if (item.type === 'dir') {
            const subFiles = await this.getRepositoryFiles(item.path);
            files.push(...subFiles);
          }
        }
      } else if (data.type === 'file') {
        // 单个文件
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        files.push({
          path: data.path,
          content,
          sha: data.sha,
        });
      }

      return files;
    } catch (error) {
      console.error('获取仓库文件失败:', error);
      throw error;
    }
  }

  // 获取单个文件内容
  async getFileContent(path: string): Promise<string | null> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub服务未初始化');
    }

    const { owner, repo } = this.config;
    
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
      });

      if ('content' in data) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      
      return null;
    } catch (error) {
      console.error(`获取文件 ${path} 失败:`, error);
      return null;
    }
  }

  // 创建新分支
  async createBranch(branchName: string, fromBranch: string = 'main'): Promise<string> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub服务未初始化');
    }

    const { owner, repo } = this.config;
    
    try {
      // 获取基础分支的最新commit
      const { data: refData } = await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${fromBranch}`,
      });

      const sha = refData.object.sha;

      // 创建新分支
      await this.octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha,
      });

      return branchName;
    } catch (error) {
      console.error('创建分支失败:', error);
      throw error;
    }
  }

  // 创建或更新文件
  async createOrUpdateFile(
    path: string,
    content: string,
    message: string,
    branch: string,
    sha?: string
  ): Promise<void> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub服务未初始化');
    }

    const { owner, repo } = this.config;
    
    try {
      const contentBase64 = Buffer.from(content).toString('base64');
      
      await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: contentBase64,
        branch,
        sha,
      });
    } catch (error) {
      console.error(`创建/更新文件 ${path} 失败:`, error);
      throw error;
    }
  }

  // 删除文件
  async deleteFile(path: string, message: string, branch: string, sha: string): Promise<void> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub服务未初始化');
    }

    const { owner, repo } = this.config;
    
    try {
      await this.octokit.repos.deleteFile({
        owner,
        repo,
        path,
        message,
        sha,
        branch,
      });
    } catch (error) {
      console.error(`删除文件 ${path} 失败:`, error);
      throw error;
    }
  }

  // 创建Pull Request
  async createPullRequest(
    title: string,
    body: string,
    head: string,
    base: string = 'main'
  ): Promise<{ number: number; url: string }> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub服务未初始化');
    }

    const { owner, repo } = this.config;
    
    try {
      const { data } = await this.octokit.pulls.create({
        owner,
        repo,
        title,
        body,
        head,
        base,
      });

      return {
        number: data.number,
        url: data.html_url,
      };
    } catch (error) {
      console.error('创建Pull Request失败:', error);
      throw error;
    }
  }

  // 提交多个文件变更
  async commitChanges(
    changes: CodeChange[],
    commitMessage: string,
    branchName?: string
  ): Promise<CommitResult> {
    if (!this.octokit || !this.config) {
      return {
        success: false,
        error: 'GitHub服务未初始化',
      };
    }

    const { owner, repo } = this.config;
    const timestamp = Date.now();
    const branch = branchName || `ai-agent-update-${timestamp}`;
    
    try {
      // 创建新分支
      await this.createBranch(branch, 'main');

      // 提交所有变更
      for (const change of changes) {
        let sha: string | undefined;
        
        // 获取现有文件的sha（如果是更新或删除）
        if (change.action === 'update' || change.action === 'delete') {
          try {
            const { data } = await this.octokit.repos.getContent({
              owner,
              repo,
              path: change.path,
              ref: `heads/${branch}`,
            });
            
            if ('sha' in data) {
              sha = data.sha;
            }
          } catch {
            // 文件不存在，当作create处理
            console.warn(`文件 ${change.path} 不存在，将创建新文件`);
          }
        }

        if (change.action === 'delete') {
          if (sha) {
            await this.deleteFile(
              change.path,
              `${commitMessage} - 删除 ${change.path}`,
              branch,
              sha
            );
          }
        } else {
          await this.createOrUpdateFile(
            change.path,
            change.content,
            `${commitMessage} - ${change.action === 'create' ? '创建' : '更新'} ${change.path}`,
            branch,
            sha
          );
        }
      }

      // 创建Pull Request
      const pr = await this.createPullRequest(
        `AI Agent 自动更新 - ${new Date().toLocaleString()}`,
        `由AI Agent自动生成的代码更新\n\n变更内容:\n${changes.map(c => `- ${c.action}: ${c.path}`).join('\n')}`,
        branch
      );

      return {
        success: true,
        branch,
        url: pr.url,
      };
    } catch (error) {
      console.error('提交变更失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  // 测试连接
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.octokit) {
      return {
        success: false,
        message: 'GitHub Token未配置',
      };
    }

    try {
      const { data } = await this.octokit.users.getAuthenticated();
      return {
        success: true,
        message: `连接成功！用户: ${data.login}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '连接失败',
      };
    }
  }

  // List workflow runs for a repository
  async listWorkflowRuns(
    branch?: string,
    perPage: number = 10
  ): Promise<GitHubWorkflowRun[]> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub服务未初始化');
    }

    const { owner, repo } = this.config;
    
    try {
      const { data } = await this.octokit.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        branch,
        per_page: perPage,
      });

      return data.workflow_runs.map(run => ({
        id: run.id,
        name: run.name ?? null,
        status: run.status === 'in_progress' ? 'in_progress' : 
                run.status === 'queued' ? 'queued' : 
                run.conclusion === 'success' ? 'completed' : 'failure',
        conclusion: run.conclusion === 'success' || run.conclusion === 'failure' || run.conclusion === 'timed_out' ? run.conclusion : null,
        url: run.url,
        html_url: run.html_url,
        created_at: run.created_at,
        updated_at: run.updated_at,
      }));
    } catch (error) {
      console.error('获取Workflow Runs失败:', error);
      throw error;
    }
  }

  // Get specific workflow run status
  async getWorkflowRunStatus(runId: number): Promise<GitHubWorkflowRun> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub服务未初始化');
    }

    const { owner, repo } = this.config;
    
    try {
      const { data } = await this.octokit.actions.getWorkflowRun({
        owner,
        repo,
        run_id: runId,
      });

      return {
        id: data.id,
        name: data.name ?? null,
        status: data.status === 'in_progress' ? 'in_progress' : 
                data.status === 'queued' ? 'queued' : 
                data.conclusion === 'success' ? 'completed' : 'failure',
        conclusion: data.conclusion === 'success' || data.conclusion === 'failure' || data.conclusion === 'timed_out' ? data.conclusion : null,
        url: data.url,
        html_url: data.html_url,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error) {
      console.error('获取Workflow Run状态失败:', error);
      throw error;
    }
  }

  // Wait for workflow completion with polling
  async waitForWorkflowCompletion(
    runId: number,
    options: {
      timeout?: number;
      interval?: number;
      onProgress?: (status: GitHubWorkflowRun) => void;
    } = {}
  ): Promise<GitHubWorkflowRun> {
    const {
      timeout = 15 * 60 * 1000,
      interval = 5000,
      onProgress,
    } = options;

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.getWorkflowRunStatus(runId);
      
      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'completed' || status.status === 'failure') {
        return status;
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error(`Workflow completion timeout after ${timeout}ms`);
  }

  // Merge pull request
  async mergePullRequest(
    prNumber: number,
    options: {
      commitTitle?: string;
      commitMessage?: string;
      method?: 'merge' | 'squash' | 'rebase';
    } = {}
  ): Promise<{ merged: boolean; sha?: string; message: string }> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub服务未初始化');
    }

    const { owner, repo } = this.config;
    
    try {
      const { data } = await this.octokit.pulls.merge({
        owner,
        repo,
        pull_number: prNumber,
        commit_title: options.commitTitle,
        commit_message: options.commitMessage,
        merge_method: options.method || 'merge',
      });

      return {
        merged: data.merged,
        sha: data.sha,
        message: data.merged ? 'Pull request merged successfully' : 'Merge failed',
      };
    } catch (error) {
      console.error('合并PR失败:', error);
      throw error;
    }
  }

  // Trigger OpenCode workflow in target repository
  async triggerOpenCodeWorkflow(
    owner: string,
    repo: string,
    taskDescription: string,
    requirements?: string,
    ref: string = 'main'
  ): Promise<{ success: boolean; workflowUrl?: string; error?: string }> {
    if (!this.octokit) {
      throw new Error('GitHub服务未初始化');
    }

    try {
      // Get all workflows in target repository
      const { data: workflowsData } = await this.octokit.rest.actions.listRepoWorkflows({
        owner,
        repo,
        per_page: 100,
      });

      // Find OpenCode Agent workflow
      let targetWorkflow = workflowsData.workflows.find((w: any) =>
        w.name === 'OpenCode Agent' || 
        w.path === '.github/workflows/opencode-agent.yml'
      );

      // Fallback: find any workflow containing "opencode"
      if (!targetWorkflow) {
        targetWorkflow = workflowsData.workflows.find((w: any) =>
          w.name?.toLowerCase().includes('opencode')
        );
      }

      if (!targetWorkflow) {
        throw new Error(
          '在目标仓库中未找到 OpenCode workflow。\n' +
          '请确认：\n' +
          '1. investment-advisor 仓库是否已安装 OpenCode GitHub App\n' +
          '2. 是否存在 .github/workflows/opencode-agent.yml 文件\n' +
          '3. workflow 是否已启用'
        );
      }

      console.log(`找到 OpenCode workflow: ${targetWorkflow.name} (ID: ${targetWorkflow.id})`);

      // Trigger workflow_dispatch event
      await this.octokit.rest.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: targetWorkflow.id,
        ref,
        inputs: {
          task_description: taskDescription,
          requirements: requirements || '',
        },
      });

      const workflowUrl = `https://github.com/${owner}/${repo}/actions/workflows/${targetWorkflow.id}`;

      return {
        success: true,
        workflowUrl,
      };
    } catch (error) {
      console.error('触发 OpenCode workflow 失败:', error);

      let errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('Not Found')) {
        errorMessage = `找不到仓库 ${owner}/${repo}，请确认仓库名称正确`;
      } else if (errorMessage.includes('resource not accessible')) {
        errorMessage = `无权限访问仓库 ${owner}/${repo}。\n` +
          `请检查 GITHUB_TOKEN 是否有 repo 权限，并将 infinite-minds 的 GitHub 账号添加为协作者`;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Get workflow run by ID
  async getWorkflowRunById(
    owner: string,
    repo: string,
    runId: number
  ): Promise<GitHubWorkflowRun | null> {
    if (!this.octokit) {
      throw new Error('GitHub服务未初始化');
    }

    try {
      const { data } = await this.octokit.rest.actions.getWorkflowRun({
        owner,
        repo,
        run_id: runId,
      });

      return {
        id: data.id,
        name: data.name,
        status: data.status === 'in_progress' ? 'in_progress' :
                data.status === 'queued' ? 'queued' : 
                data.conclusion === 'success' ? 'completed' : 'failed',
        conclusion: data.conclusion,
        url: data.url,
        html_url: data.html_url,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error) {
      console.error(`获取 workflow run ${runId} 失败:`, error);
      return null;
    }
  }

  // List pull requests for a repository
  async listPullRequests(
    state: 'open' | 'closed' | 'all' = 'all',
    perPage: number = 10,
    sort: 'created' | 'updated' | 'popularity' | 'long-running' = 'created',
    direction: 'asc' | 'desc' = 'desc'
  ): Promise<any[]> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub服务未初始化');
    }

    const { owner, repo } = this.config;
    
    try {
      const { data } = await this.octokit.pulls.list({
        owner,
        repo,
        state,
        per_page: perPage,
        sort,
        direction,
      });

      return data;
    } catch (error) {
      console.error('获取 Pull Requests 失败:', error);
      throw error;
    }
  }
}

// 单例模式
let githubServiceInstance: GitHubService | null = null;

export function getGitHubService(config?: GitHubConfig): GitHubService {
  if (!githubServiceInstance || config) {
    githubServiceInstance = new GitHubService(config);
  }
  return githubServiceInstance;
}

export function resetGitHubService(): void {
  githubServiceInstance = null;
}
