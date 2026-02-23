'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
    return (
        <div className={`markdown-content ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-blue-800 border-b pb-2" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-3 text-blue-700" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-4 mb-2 text-blue-600" {...props} />,
                    h4: ({ node, ...props }) => <h4 className="text-base font-bold mt-3 mb-1 text-gray-800" {...props} />,
                    p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-gray-700" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-700" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-1 text-gray-700" {...props} />,
                    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                    blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-blue-200 pl-4 py-1 italic bg-blue-50/50 my-4 rounded-r-lg" {...props} />
                    ),
                    code: ({ node, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !match;
                        return isInline ? (
                            <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-sm text-pink-600" {...props}>
                                {children}
                            </code>
                        ) : (
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl my-4 overflow-x-auto font-mono text-sm scrollbar-thin">
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            </pre>
                        );
                    },
                    table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-6 rounded-xl border border-gray-100 shadow-sm">
                            <table className="w-full text-sm text-left text-gray-700" {...props} />
                        </div>
                    ),
                    thead: ({ node, ...props }) => <thead className="bg-gray-50/80 text-gray-900 font-bold border-b border-gray-100" {...props} />,
                    th: ({ node, ...props }) => <th className="px-4 py-3" {...props} />,
                    td: ({ node, ...props }) => <td className="px-4 py-3 border-b border-gray-50" {...props} />,
                    hr: ({ node, ...props }) => <hr className="my-8 border-gray-100" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold text-gray-900" {...props} />,
                    a: ({ node, ...props }) => <a className="text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-2" {...props} />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};
