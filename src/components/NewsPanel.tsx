'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getRSSNewsService, type NewsItem } from '@/lib/services/rssNews';
import { Newspaper, ExternalLink, RefreshCw, Clock } from 'lucide-react';

export const NewsPanel: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const service = getRSSNewsService();
      const items = await service.fetchLatestNews(5);
      setNews(items);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch news');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <Card className="h-full border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold">Latest News</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchNews}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>Updated {formatDate(lastUpdated.toISOString())}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[300px] pr-4">
          {loading && news.length === 0 ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm mb-2">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchNews}>
                Try Again
              </Button>
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No news available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {news.map((item, index) => (
                <div
                  key={index}
                  className="group p-3 rounded-lg hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                >
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h4>
                      <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{item.source}</span>
                      {item.pubDate && (
                        <>
                          <span>•</span>
                          <span>{formatDate(item.pubDate)}</span>
                        </>
                      )}
                    </div>
                  </a>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
