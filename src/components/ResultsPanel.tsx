'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAgentStore } from '@/store/agentStore';
import { Sparkles, Newspaper, FileText, Globe, Code, Github, Terminal, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarkdownRenderer } from './MarkdownRenderer';
import { format } from 'date-fns';

export const ResultsPanel: React.FC = () => {
    const results = useAgentStore((state) => state.results);
    const isExecuting = useAgentStore((state) => state.isExecuting);

    return (
        <Card className="h-full border border-gray-200 shadow-xl rounded-3xl overflow-hidden flex flex-col bg-white">
            <CardHeader className="pb-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold text-gray-800">Workspace Results</CardTitle>
                        <p className="text-xs text-gray-500 mt-0.5">Final outputs from your AI team</p>
                    </div>
                    {isExecuting && (
                        <div className="ml-auto flex items-center gap-2 text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full animate-pulse">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Generating...
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden relative">
                <ScrollArea className="h-full absolute inset-0">
                    <div className="p-6 space-y-6">
                        {results.length === 0 && !isExecuting ? (
                            <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                                <FileText className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-base font-medium text-gray-500">No results to display</p>
                                <p className="text-sm mt-1">Assign a task to generate outputs.</p>
                            </div>
                        ) : (
                            results.map((result, idx) => {
                                const isNewsLike = result.type === 'news' || result.type === 'investment';
                                const isGithub = result.type === 'github';
                                const isDev = result.type === 'dev' || result.type === 'text';

                                return (
                                    <div key={result.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-sm border border-gray-100 rounded-2xl bg-white overflow-hidden" style={{ animationDelay: (idx * 100) + 'ms' }}>
                                        {/* Header */}
                                        <div className="px-5 py-3 border-b border-gray-50 bg-gray-50 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {isNewsLike && <Newspaper className="w-4 h-4 text-blue-500" />}
                                                {isGithub && <Github className="w-4 h-4 text-gray-700" />}
                                                {isDev && <Terminal className="w-4 h-4 text-emerald-500" />}
                                                <span className="font-semibold text-sm text-gray-800">{result.title}</span>
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {format(new Date(result.timestamp), 'HH:mm:ss')}
                                            </span>
                                        </div>

                                        {/* Content Body */}
                                        <div className="p-5">
                                            {isNewsLike && result.data && (
                                                <div className="space-y-4">
                                                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <FileText className="w-4 h-4 text-blue-600" />
                                                            <span className="text-sm font-semibold text-blue-900">Summary</span>
                                                        </div>
                                                        <p className="text-sm text-gray-700 leading-relaxed">
                                                            {result.data.original}
                                                        </p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Globe className="w-4 h-4 text-slate-600" />
                                                            <span className="text-sm font-semibold text-slate-800">Chinese Translation</span>
                                                        </div>
                                                        <p className="text-sm text-gray-700 leading-relaxed">
                                                            {result.data.translated}
                                                        </p>
                                                    </div>
                                                    {result.data.articles && result.data.articles.length > 0 && (
                                                        <div className="pt-2">
                                                            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                                <FileText className="w-4 h-4" />
                                                                Sources ({result.data.articles.length})
                                                            </h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {result.data.articles.map((article: any, index: number) => (
                                                                    <a key={index} href={article.url} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                                                                        <h5 className="text-xs font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                                            {article.title}
                                                                        </h5>
                                                                        <span className="text-[10px] text-gray-500 mt-2 block font-medium uppercase tracking-wider">{article.source}</span>
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {isGithub && result.data && (
                                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center">
                                                    <Github className="w-12 h-12 text-gray-800 mx-auto mb-3" />
                                                    <h4 className="font-bold text-gray-900 mb-2">Repository Updated</h4>
                                                    {result.data.pullRequestUrl ? (
                                                        <a href={result.data.pullRequestUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors mt-2">
                                                            View Pull Request
                                                        </a>
                                                    ) : (
                                                        <p className="text-sm text-gray-600 max-w-sm mx-auto">
                                                            Changes generated successfully but no GitHub token was provided. Changes are applied locally or as patches in the chat.
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {isDev && result.data && (
                                                <div className="prose prose-sm max-w-none prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl">
                                                    <MarkdownRenderer content={typeof result.data === 'string' ? result.data : JSON.stringify(result.data)} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {/* Scroll bottom padding */}
                        <div className="h-4"></div>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card >
    );
};
