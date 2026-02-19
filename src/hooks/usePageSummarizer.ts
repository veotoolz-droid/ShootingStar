import { useState, useCallback } from 'react';

// @ts-ignore - Readability is loaded dynamically
let Readability: any = null;

export interface PageSummary {
  title: string;
  content: string;
  excerpt: string;
  byline?: string;
  dir?: string;
  length: number;
  siteName?: string;
}

export function usePageSummarizer() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PageSummary | null>(null);

  // Load Readability.js dynamically
  const loadReadability = useCallback(async () => {
    if (Readability) return Readability;
    
    try {
      // Import Readability
      const module = await import('@mozilla/readability');
      Readability = module.Readability;
      return Readability;
    } catch (err) {
      console.error('Failed to load Readability:', err);
      throw new Error('Failed to load page summarization library');
    }
  }, []);

  const extractContent = useCallback(async (url: string): Promise<PageSummary> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch the page content
      const response = await fetch(url, {
        headers: {
          'Accept': 'text/html',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Parse with Readability
      const ReadabilityClass = await loadReadability();
      
      // Create a DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Use Readability to extract article content
      const reader = new ReadabilityClass(doc);
      const article = reader.parse();
      
      if (!article) {
        throw new Error('Could not extract readable content from this page');
      }
      
      const result: PageSummary = {
        title: article.title || 'Untitled',
        content: article.content || '',
        excerpt: article.excerpt || '',
        byline: article.byline,
        dir: article.dir,
        length: article.length || 0,
        siteName: article.siteName,
      };
      
      setSummary(result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to extract page content';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadReadability]);

  const extractFromHtml = useCallback(async (html: string, url?: string): Promise<PageSummary> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const ReadabilityClass = await loadReadability();
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Set base URL if provided
      if (url) {
        const base = doc.createElement('base');
        base.href = url;
        doc.head.appendChild(base);
      }
      
      const reader = new ReadabilityClass(doc);
      const article = reader.parse();
      
      if (!article) {
        throw new Error('Could not extract readable content');
      }
      
      const result: PageSummary = {
        title: article.title || 'Untitled',
        content: article.content || '',
        excerpt: article.excerpt || '',
        byline: article.byline,
        dir: article.dir,
        length: article.length || 0,
        siteName: article.siteName,
      };
      
      setSummary(result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to extract content';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadReadability]);

  const clearSummary = useCallback(() => {
    setSummary(null);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    summary,
    extractContent,
    extractFromHtml,
    clearSummary,
  };
}

export default usePageSummarizer;
