// GitHub Service - Real GitHub API Operations
// Real GitHub API Operations Service

import { Octokit } from '@octokit/rest';
import type { CodeChange, GitHubWorkflowRun, GitHubWorkflowJob, GitHubWorkflowStep, WorkflowDetailedStatus } from '@/types';

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

  // Get repository file list
  async getRepositoryFiles(path: string = ''): Promise<FileContent[]> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub service not initialized');
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
        // Directory
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
        // Single file
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        files.push({
          path: data.path,
          content,
          sha: data.sha,
        });
      }

      return files;
    } catch (error) {
      console.error('Failed to get repository files::', error);
      throw error;
    }
  }

  // 获取Single file内容
  async getFileContent(path: string): Promise<string | null> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub service not initialized');
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
      console.error(`Failed to get file:`, error);
      return null;
    }
  }

  // Create new branch
  async createBranch(branchName: string, fromBranch: string = 'main'): Promise<string> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub service not initialized');
    }

    const { owner, repo } = this.config;
    
    try {
      // Get latest commit from base branch
      const { data: refData } = await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${fromBranch}`,
      });

      const sha = refData.object.sha;

      // Create new branch
      await this.octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha,
      });

      return branchName;
    } catch (error) {
      console.error('Failed to create branch::', error);
      throw error;
    }
  }

  // Create or update file
  async createOrUpdateFile(
    path: string,
    content: string,
    message: string,
    branch: string,
    sha?: string
  ): Promise<void> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub service not initialized');
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
      console.error(`Failed to create/update file:`, error);
      throw error;
    }
  }

  // Delete file
  async deleteFile(path: string, message: string, branch: string, sha: string): Promise<void> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub service not initialized');
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
      console.error(`Delete file ${path} 失败:`, error);
      throw error;
    }
  }

  // Create Pull Request
  async createPullRequest(
    title: string,
    body: string,
    head: string,
    base: string = 'main'
  ): Promise<{ number: number; url: string }> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub service not initialized');
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
      console.error('Create Pull Request失败:', error);
      throw error;
    }
  }

  // Commit multiple file changes
  async commitChanges(
    changes: CodeChange[],
    commitMessage: string,
    branchName?: string
  ): Promise<CommitResult> {
    if (!this.octokit || !this.config) {
      return {
        success: false,
        error: 'GitHub service not initialized',
      };
    }

    const { owner, repo } = this.config;
    const timestamp = Date.now();
    const branch = branchName || `ai-agent-update-${timestamp}`;
    
    try {
      // Create new branch
      await this.createBranch(branch, 'main');

      // Commit all changes
      for (const change of changes) {
        let sha: string | undefined;
        
        // Get existing file sha（如果是Update或Delete）
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
            // File does not exist, treating as create
            console.warn(`File does not exist, will create new file`);
          }
        }

        if (change.action === 'delete') {
          if (sha) {
            await this.deleteFile(
              change.path,
              `${commitMessage} - Delete ${change.path}`,
              branch,
              sha
            );
          }
        } else {
          await this.createOrUpdateFile(
            change.path,
            change.content,
            `${commitMessage} - ${change.action === 'create' ? 'Create' : 'Update'} ${change.path}`,
            branch,
            sha
          );
        }
      }

      // Create Pull Request
      const pr = await this.createPullRequest(
        `AI Agent 自动Update - ${new Date().toLocaleString()}`,
        `由AI Agent自动生成的代码Update\n\nChanges:\n${changes.map(c => `- ${c.action}: ${c.path}`).join('\n')}`,
        branch
      );

      return {
        success: true,
        branch,
        url: pr.url,
      };
    } catch (error) {
      console.error('Failed to commit changes::', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Test connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.octokit) {
      return {
        success: false,
        message: 'GitHub Token not configured',
      };
    }

    try {
      const { data } = await this.octokit.users.getAuthenticated();
      return {
        success: true,
        message: `Connection successful! User: ${data.login}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  // List workflow runs for a repository
  async listWorkflowRuns(
    branch?: string,
    perPage: number = 10
  ): Promise<GitHubWorkflowRun[]> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub service not initialized');
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
      console.error('Failed to get Workflow Runs::', error);
      throw error;
    }
  }

  // Get specific workflow run status
  async getWorkflowRunStatus(runId: number): Promise<GitHubWorkflowRun> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub service not initialized');
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
      console.error('Failed to get Workflow Run status::', error);
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
      throw new Error('GitHub service not initialized');
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
      console.error('Failed to merge PR::', error);
      throw error;
    }
  }

  // Create GitHub Issue with OpenCode trigger command
  async createOpenCodeIssue(
    owner: string,
    repo: string,
    taskDescription: string,
    requirements?: string,
    source: string = 'infinite-minds'
  ): Promise<{ success: boolean; issueUrl?: string; issueNumber?: number; error?: string }> {
    if (!this.octokit) {
      throw new Error('GitHub service not initialized');
    }

    try {
      const timestamp = new Date().toISOString();
      const issueTitle = `[${source}] ${taskDescription.split('\n')[0].substring(0, 80)}`;
      
      const issueBody = `## Task Description
${taskDescription}

## Detailed Requirements
${requirements || 'No detailed requirements provided'}

## Source
- Triggered by: ${source}
- Timestamp: ${timestamp}

---
/opencode please help implement this task`;

      // Create Issue
      const { data: issue } = await this.octokit.rest.issues.create({
        owner,
        repo,
        title: issueTitle,
        body: issueBody,
        labels: ['opencode', 'ai-generated'],
      });

      console.log(`Created Issue #${issue.number}: ${issue.html_url}`);

      return {
        success: true,
        issueUrl: issue.html_url,
        issueNumber: issue.number,
      };
    } catch (error) {
      console.error('Failed to create OpenCode Issue::', error);

      let errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('Not Found')) {
        errorMessage = `Cannot find repository ${owner}/${repo}, please verify repository name`;
      } else if (errorMessage.includes('resource not accessible')) {
        errorMessage = `No permission to access repository ${owner}/${repo}。\n` +
          `Please check if GITHUB_TOKEN has issues:write permission`;
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
      throw new Error('GitHub service not initialized');
    }

    try {
      const { data } = await this.octokit.rest.actions.getWorkflowRun({
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
        conclusion: data.conclusion as GitHubWorkflowRun['conclusion'],
        url: data.url,
        html_url: data.html_url ?? '',
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error) {
      console.error(`Failed to get workflow run ${runId}:`, error);
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
      throw new Error('GitHub service not initialized');
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
      console.error('Failed to list pull requests:', error);
      throw error;
    }
  }

  // List jobs for a workflow run
  async listWorkflowJobs(runId: number): Promise<GitHubWorkflowJob[]> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub service not initialized');
    }

    const { owner, repo } = this.config;
    
    try {
      const { data } = await this.octokit.rest.actions.listJobsForWorkflowRun({
        owner,
        repo,
        run_id: runId,
      });

      return data.jobs.map(job => ({
        id: job.id,
        name: job.name,
        status: job.status as GitHubWorkflowJob['status'],
        conclusion: job.conclusion as GitHubWorkflowJob['conclusion'],
        started_at: job.started_at,
        completed_at: job.completed_at,
        html_url: job.html_url ?? '',
        steps: job.steps?.map(step => ({
          name: step.name,
          status: step.status as GitHubWorkflowStep['status'],
          conclusion: step.conclusion as GitHubWorkflowStep['conclusion'],
          number: step.number,
          started_at: step.started_at,
          completed_at: step.completed_at,
        })) || [],
      }));
    } catch (error) {
      console.error('Failed to get workflow jobs:', error);
      return [];
    }
  }

  // Get detailed workflow status including jobs and steps
  async getWorkflowDetailedStatus(runId: number): Promise<WorkflowDetailedStatus> {
    if (!this.octokit || !this.config) {
      throw new Error('GitHub service not initialized');
    }

    const [run, jobs] = await Promise.all([
      this.getWorkflowRunStatus(runId),
      this.listWorkflowJobs(runId),
    ]);

    // Find current running job and step
    const currentJob = jobs.find(j => j.status === 'in_progress');
    const currentStep = currentJob?.steps.find(s => s.status === 'in_progress');

    // Calculate overall progress
    const progress = this.calculateWorkflowProgress(jobs);

    return {
      run,
      jobs,
      currentJob,
      currentStep,
      progress,
    };
  }

  // Calculate workflow progress percentage based on completed steps
  private calculateWorkflowProgress(jobs: GitHubWorkflowJob[]): number {
    if (jobs.length === 0) return 0;
    
    const totalSteps = jobs.reduce((sum, job) => sum + (job.steps?.length || 1), 0);
    const completedSteps = jobs.reduce((sum, job) => {
      return sum + (job.steps?.filter(s => s.status === 'completed').length || 0);
    }, 0);
    
    return Math.round((completedSteps / totalSteps) * 100);
  }
}

// Singleton pattern
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
