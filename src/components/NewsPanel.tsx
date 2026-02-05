'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAgentStore } from '@/store/agentStore';
import { Newspaper, FileText, Globe } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export const NewsPanel: React.FC = () => {
  const currentResult = useAgentStore((state) => state.currentResult);

  if (!currentResult) {
    return (
      <Card className="h-full border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold">News Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No news summary yet</p>
            <p className="text-xs mt-2">Click "News Assistant" to generate</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg font-semibold">News Summary</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {/* English Summary */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">English Summary</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {currentResult.original}
              </p>
            </div>

            {/* Chinese Translation */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Chinese Translation</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {currentResult.translated}
              </p>
            </div>

            {/* Articles List */}
            {currentResult.articles.length > 0 && (
              <div className="pt-2">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Newspaper className="w-4 h-4" />
                  Related Articles ({currentResult.articles.length})
                </h4>
                <div className="space-y-2">
                  {currentResult.articles.map((article, index) => (
                    <div
                      key={index}
                      className="p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <h5 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {article.title}
                      </h5>
                      {article.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {article.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <span className="font-medium">{article.source}</span>
                        {article.url && (
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Read more →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};