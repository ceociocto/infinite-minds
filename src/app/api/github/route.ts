import { NextRequest, NextResponse } from 'next/server';
import { GitHubService } from '@/lib/services/github';
import type { CodeChange } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // 从 Cloudflare Workers 环境变量获取 Token
    const token = process.env.GITHUB_TOKEN;
    
    if (!token) {
      console.error('GITHUB_TOKEN not found in environment variables');
      return NextResponse.json(
        { success: false, error: 'GITHUB_TOKEN not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { action, owner, repo, ...params } = body;

    const service = new GitHubService({ token, owner, repo });

    switch (action) {
      case 'test': {
        return NextResponse.json(await service.testConnection());
      }
      
      case 'getRepositoryFiles': {
        const files = await service.getRepositoryFiles(params.path || '');
        return NextResponse.json({ success: true, files });
      }
      
      case 'getFile': {
        const content = await service.getFileContent(params.path);
        return NextResponse.json({ success: true, content });
      }
      
      case 'createBranch': {
        const branch = await service.createBranch(params.branchName, params.baseBranch);
        return NextResponse.json({ success: true, branch });
      }
      
      case 'commit': {
        const commit = await service.commitChanges(
          params.changes as CodeChange[],
          params.message,
          params.branchName
        );
        return NextResponse.json(commit);
      }
      
      case 'createPR': {
        const pr = await service.createPullRequest(
          params.title,
          params.body,
          params.head,
          params.base
        );
        return NextResponse.json({ success: true, pullRequest: pr });
      }
      
      case 'listWorkflowRuns': {
        const runs = await service.listWorkflowRuns(params.branch, params.perPage);
        return NextResponse.json({ success: true, runs });
      }
      
      case 'getWorkflowRun': {
        const runStatus = await service.getWorkflowRunStatus(params.runId);
        return NextResponse.json({ success: true, run: runStatus });
      }
      
      case 'mergePR': {
        const mergeResult = await service.mergePullRequest(
          params.prNumber,
          params.options
        );
        return NextResponse.json({ success: true, merge: mergeResult });
      }

      case 'triggerOpenCode': {
        const result = await service.triggerOpenCodeWorkflow(
          owner,
          repo,
          params.taskDescription,
          params.requirements,
          params.ref
        );
        return NextResponse.json(result);
      }

      case 'getWorkflowRunById': {
        const run = await service.getWorkflowRunById(
          owner,
          repo,
          Number(params.runId)
        );
        if (!run) {
          return NextResponse.json(
            { success: false, error: 'Workflow run not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({ success: true, run });
      }

      case 'listPullRequests': {
        const pullRequests = await service.listPullRequests(
          params.state,
          params.perPage,
          params.sort,
          params.direction
        );
        return NextResponse.json({ success: true, pullRequests });
      }
      
      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('GitHub API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}