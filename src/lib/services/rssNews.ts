// RSS News Service
// 从OPML文件获取RSS源并获取最新新闻

export interface RSSFeed {
  title: string;
  xmlUrl: string;
  htmlUrl: string;
}

export interface NewsItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  source: string;
}

const OPML_URL = 'https://gist.githubusercontent.com/emschwartz/e6d2bf860ccc367fe37ff953ba6de66b/raw/hn-popular-blogs-2025.opml';
const OPML_CACHE_KEY = 'hn_popular_blogs_opml';
const NEWS_CACHE_KEY = 'rss_news_cache';
const CACHE_DURATION = 1000 * 60 * 30; // 30分钟缓存

export class RSSNewsService {
  private feeds: RSSFeed[] = [];

  // 获取并解析OPML文件
  async fetchOPML(): Promise<RSSFeed[]> {
    try {
      // 先检查本地缓存
      const cached = localStorage.getItem(OPML_CACHE_KEY);
      if (cached) {
        this.feeds = JSON.parse(cached);
        return this.feeds;
      }

      // 从网络获取
      const response = await fetch(OPML_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch OPML: ${response.status}`);
      }

      const opmlText = await response.text();
      this.feeds = this.parseOPML(opmlText);
      
      // 保存到本地缓存
      localStorage.setItem(OPML_CACHE_KEY, JSON.stringify(this.feeds));
      
      return this.feeds;
    } catch (error) {
      console.error('Error fetching OPML:', error);
      // 如果失败，尝试使用缓存
      const cached = localStorage.getItem(OPML_CACHE_KEY);
      if (cached) {
        this.feeds = JSON.parse(cached);
        return this.feeds;
      }
      return [];
    }
  }

  // 解析OPML XML
  private parseOPML(opmlText: string): RSSFeed[] {
    const feeds: RSSFeed[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(opmlText, 'text/xml');
    
    // 查找所有outline元素
    const outlines = doc.querySelectorAll('outline[type="rss"]');
    
    outlines.forEach((outline) => {
      const title = outline.getAttribute('title') || outline.getAttribute('text') || '';
      const xmlUrl = outline.getAttribute('xmlUrl') || '';
      const htmlUrl = outline.getAttribute('htmlUrl') || '';
      
      if (xmlUrl) {
        feeds.push({ title, xmlUrl, htmlUrl });
      }
    });
    
    return feeds;
  }

  // 获取最新新闻（从多个RSS源）
  async fetchLatestNews(count: number = 5): Promise<NewsItem[]> {
    // 检查缓存
    const cached = this.getCachedNews();
    if (cached) {
      return cached.slice(0, count);
    }

    // 确保已加载feeds
    if (this.feeds.length === 0) {
      await this.fetchOPML();
    }

    // 随机选择几个feed来获取新闻（避免请求太多）
    const selectedFeeds = this.getRandomFeeds(3);
    const allNews: NewsItem[] = [];

    // 使用CORS代理服务
    const corsProxies = [
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?',
    ];

    for (const feed of selectedFeeds) {
      try {
        // 尝试不同的代理
        for (const proxy of corsProxies) {
          try {
            const response = await fetch(`${proxy}${encodeURIComponent(feed.xmlUrl)}`, {
              signal: AbortSignal.timeout(10000), // 10秒超时
            });
            
            if (response.ok) {
              const rssText = await response.text();
              const items = this.parseRSS(rssText, feed.title);
              allNews.push(...items);
              break; // 成功则跳出代理循环
            }
          } catch (e) {
            console.warn(`Proxy failed for ${feed.title}:`, e);
            continue; // 尝试下一个代理
          }
        }
      } catch (error) {
        console.error(`Error fetching RSS from ${feed.title}:`, error);
      }
    }

    // 按日期排序并取最新的
    const sortedNews = this.sortByDate(allNews).slice(0, count);
    
    // 缓存结果
    this.cacheNews(sortedNews);
    
    return sortedNews;
  }

  // 随机选择n个feed
  private getRandomFeeds(n: number): RSSFeed[] {
    if (this.feeds.length <= n) return this.feeds;
    
    const shuffled = [...this.feeds].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  }

  // 解析RSS XML
  private parseRSS(rssText: string, source: string): NewsItem[] {
    const items: NewsItem[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(rssText, 'text/xml');
    
    // 检查是否是Atom格式
    const isAtom = doc.querySelector('feed') !== null;
    
    if (isAtom) {
      // Atom格式
      const entries = doc.querySelectorAll('entry');
      entries.forEach((entry) => {
        const title = entry.querySelector('title')?.textContent || '';
        const link = entry.querySelector('link')?.getAttribute('href') || '';
        const description = entry.querySelector('summary, content')?.textContent || '';
        const pubDate = entry.querySelector('published, updated')?.textContent || '';
        
        if (title && link) {
          items.push({
            title: this.cleanText(title),
            link,
            description: this.cleanText(description).slice(0, 200),
            pubDate,
            source,
          });
        }
      });
    } else {
      // RSS 2.0格式
      const rssItems = doc.querySelectorAll('item');
      rssItems.forEach((item) => {
        const title = item.querySelector('title')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '';
        const description = item.querySelector('description')?.textContent || '';
        const pubDate = item.querySelector('pubDate')?.textContent || '';
        
        if (title && link) {
          items.push({
            title: this.cleanText(title),
            link,
            description: this.cleanText(description).slice(0, 200),
            pubDate,
            source,
          });
        }
      });
    }
    
    return items;
  }

  // 清理文本（移除HTML标签）
  private cleanText(text: string): string {
    if (!text) return '';
    // 移除HTML标签
    return text.replace(/<[^>]*>/g, '').trim();
  }

  // 按日期排序
  private sortByDate(items: NewsItem[]): NewsItem[] {
    return items.sort((a, b) => {
      const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return dateB - dateA;
    });
  }

  // 获取缓存的新闻
  private getCachedNews(): NewsItem[] | null {
    const cached = localStorage.getItem(NEWS_CACHE_KEY);
    if (!cached) return null;
    
    try {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem(NEWS_CACHE_KEY);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  // 缓存新闻
  private cacheNews(items: NewsItem[]): void {
    localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data: items,
    }));
  }

  // 清除缓存
  clearCache(): void {
    localStorage.removeItem(OPML_CACHE_KEY);
    localStorage.removeItem(NEWS_CACHE_KEY);
  }

  // 获取所有feeds
  getFeeds(): RSSFeed[] {
    return this.feeds;
  }
}

// 单例模式
let rssServiceInstance: RSSNewsService | null = null;

export function getRSSNewsService(): RSSNewsService {
  if (!rssServiceInstance) {
    rssServiceInstance = new RSSNewsService();
  }
  return rssServiceInstance;
}

export function resetRSSNewsService(): void {
  rssServiceInstance = null;
}
