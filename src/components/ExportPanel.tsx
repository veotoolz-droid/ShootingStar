import { X, FileText, Download, Copy } from 'lucide-react';
import { useExport } from '../hooks/useExport';
import { useToast } from '../hooks/useToast';

interface Source {
  title: string;
  url: string;
  domain: string;
  snippet?: string;
}

interface SearchResult {
  query: string;
  answer: string;
  sources: Source[];
  timestamp: number;
  searchMode: string;
  provider: string;
}

interface ExportPanelProps {
  result: SearchResult;
  onClose: () => void;
}

export function ExportPanel({ result, onClose }: ExportPanelProps) {
  const { isExporting, downloadMarkdown, downloadPDF, downloadHTML, exportToMarkdown } = useExport();
  const { success, error } = useToast();

  const handleCopy = async () => {
    try {
      const markdown = exportToMarkdown(result);
      await navigator.clipboard.writeText(markdown);
      success('Copied to clipboard!');
    } catch (err) {
      error('Failed to copy');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <Download className="w-5 h-5 text-violet-500" />
            Export & Share
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <button
            onClick={() => { downloadMarkdown(result); success('Markdown downloaded!'); }}
            disabled={isExporting}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-violet-500/50 hover:bg-violet-500/5 transition-all text-left disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Download Markdown</p>
              <p className="text-sm text-muted-foreground">Export as .md file</p>
            </div>
          </button>

          <button
            onClick={() => { downloadPDF(result); success('PDF downloaded!'); }}
            disabled={isExporting}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-violet-500/50 hover:bg-violet-500/5 transition-all text-left disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Download PDF</p>
              <p className="text-sm text-muted-foreground">Export as .pdf file</p>
            </div>
          </button>

          <button
            onClick={() => { downloadHTML(result); success('HTML downloaded!'); }}
            disabled={isExporting}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-violet-500/50 hover:bg-violet-500/5 transition-all text-left disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Download HTML</p>
              <p className="text-sm text-muted-foreground">Export as .html file</p>
            </div>
          </button>

          <div className="border-t border-border pt-3 mt-3">
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-violet-500/50 hover:bg-violet-500/5 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
                <Copy className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Copy Markdown</p>
                <p className="text-sm text-muted-foreground">Copy to clipboard</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExportPanel;
