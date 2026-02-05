import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  // 检查环境变量是否配置
  const hasZhipuKey = !!process.env.ZHIPU_API_KEY;
  const hasGitHubToken = !!process.env.GITHUB_TOKEN;
  
  console.log('Config check:', { hasZhipuKey, hasGitHubToken });
  
  return NextResponse.json({
    hasZhipuKey,
    hasGitHubToken,
  });
}