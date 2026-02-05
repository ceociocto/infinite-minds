import { NextRequest, NextResponse } from 'next/server';
import { GitHubService } from '@/lib/services/github';

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
      case 'test':
        return NextResponse.json(await service.testConnection());
      
      case 'getFile':
        const content = await service.getFileContent(params.path);
        return NextResponse.json({ success: true, content });
      
      case 'createBranch':
        const branch = await service.createBranch(params.branchName, params.baseBranch);
        return NextResponse.json({ success: true, branch });
      
      case 'commit':
        const commit = await service.commitChanges(
          params.branch,
          params.message,
          params.changes
        );
        return NextResponse.json({ success: true, commit });
      
      case 'createPR':
        const pr = await service.createPullRequest(
          params.title,
          params.body,
          params.head,
          params.base
        );
        return NextResponse.json({ success: true, pullRequest: pr });
      
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