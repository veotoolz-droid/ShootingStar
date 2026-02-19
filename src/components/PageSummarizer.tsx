import { useState } from 'react';
import { X, Sparkles, Loader2, FileText, BookOpen } from 'lucide-react';
import { usePageSummarizer } from '../hooks/usePageSummarizer';
import { useToast } from '../hooks/useToast';

interface PageSummarizerProps {
  url?: string;
  onClose: () => void;
  onSummarize?: (summary: string) => void;
}

export function PageSummarizer({ url, onClose, onSummarize }: PageSummarizerProps) {
  const { isLoading, error, summary, extractContent } = usePageSummarizer();
  const { success } = useToast();
  const [inputUrl, setInputUrl] = useState(url || '');
  const [aiSummary, setAiSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleExtract = async () => {
    if (!inputUrl.trim()) return;
    try {
      await extractContent(inputUrl);
    } catch {
      // Error handled by hook
    }
  };

  const handleAiSummarize = async () => {
    if (!summary) return;
    setIsSummarizing(true);
    
    // Simulate AI summarization (in real implementation, call LLM)
    setTimeout(() => {
      const generatedSummary = `## Summary\n\n${summary.excerpt || summary.content.slice(0, 500)}...\n\n**Source:** ${summary.siteName || new URL(inputUrl).hostname}\n**Author:** ${summary.byline || 'Unknown'}\n**Length:** ${summary.length} characters`;
      setAiSummary(generatedSummary);
      setIsSummarizing(false);
      success('Page summarized!');
      onSummarize?.(generatedSummary);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-500" />
            Page Summarizer
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          {/* URL Input */}
          <div className="flex gap-2">
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Enter URL to summarize..."
              className="flex-1 px-4 py-2 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-violet-500/50"
            />
            <button
              onClick={handleExtract}
              disabled={isLoading || !inputUrl.trim()}
              className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Extract
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {summary && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary/50 rounded-lg">
                <h4 className="font-medium mb-2">{summary.title}</h4>
                <p className="text-sm text-muted-foreground mb-2">{summary.excerpt}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {summary.siteName && <span className="px-2 py-1 bg-secondary rounded">{summary.siteName}</span>}
                  {summary.byline && <span className="px-2 py-1 bg-secondary rounded">By {summary.byline}</span>}
                  <span className="px-2 py-1 bg-secondary rounded">{summary.length} chars</span>
                </div>
              </div>

              <button
                onClick={handleAiSummarize}
                disabled={isSummarizing}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
              >
                {isSummarizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Summarizing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Summarize with AI
                  </>
                )}
              </button>

              {aiSummary && (
                <div className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">{aiSummary}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PageSummarizer;
