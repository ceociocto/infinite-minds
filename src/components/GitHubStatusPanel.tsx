'use client';

import React from 'react';
import { useAgentStore } from '@/store/agentStore';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  GitBranch,
  ExternalLink,
  FileText,
  Clock,
  GitPullRequest,
} from 'lucide-react';

export const GitHubStatusPanel: React.FC = () => {
  const { messages } = useAgentStore();

  const githubMessages = messages.filter((m) =>
    m.type === 'system' && (
      m.content.includes('🌿') ||
      m.content.includes('🚀') ||
      m.content.includes('🔄') ||
      m.content.includes('✅') ||
      m.content.includes('❌') ||
      m.content.includes('🔍') ||
      m.content.includes('⏳')
    )
  );

  return (
    <div className="glass-panel rounded-3xl p-5 shadow-xl border border-white/50">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
          <GitBranch className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800">OpenCode Workflow Status</h3>
          <p className="text-xs text-gray-500">实时监控 GitHub Actions 执行状态</p>
        </div>
      </div>

      {githubMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <GitBranch className="w-14 h-14 mb-3 opacity-20" />
          <p className="text-sm font-medium">暂无 GitHub 操作记录</p>
          <p className="text-xs text-gray-400">
            执行任务后将显示 OpenCode workflow 状态
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {githubMessages.map((msg, idx) => {
            const isLoading = msg.content.includes('🔄') || msg.content.includes('⏳');
            const isSuccess = msg.content.includes('✅');
            const isError = msg.content.includes('❌');

            let bgColor = 'bg-blue-50 border-blue-200';
            if (isSuccess) bgColor = 'bg-green-50 border-green-200';
            if (isError) bgColor = 'bg-red-50 border-red-200';

            return (
              <div
                key={msg.id}
                className={`p-4 rounded-xl border ${bgColor} transition-all hover:shadow-md`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    ) : isSuccess ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : isError ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 break-words">
                      {msg.content}
                    </p>

                    {msg.result && typeof msg.result === 'object' && (
                      <div className="mt-3 space-y-2">
                        {'workflowUrl' in msg.result && (
                          <a
                            href={(msg.result as any).workflowUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            查看 Workflow
                          </a>
                        )}

                        {'logsUrl' in msg.result && (
                          <a
                            href={(msg.result as any).logsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 font-medium"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            查看日志
                          </a>
                        )}

                        {msg.content.includes('Pull Request') && 'pullRequestUrl' in (msg.result as any) && (
                          <a
                            href={(msg.result as any).pullRequestUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:text-green-800 font-semibold"
                          >
                            <GitPullRequest className="w-3.5 h-3.5" />
                            查看 Pull Request
                          </a>
                        )}
                      </div>
                    )}

                    <p className="text-[10px] text-gray-400 mt-2">
                      {new Date(msg.timestamp).toLocaleTimeString('zh-CN')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
