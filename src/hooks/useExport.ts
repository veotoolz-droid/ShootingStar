import { useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';

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

interface ExportOptions {
  includeSources?: boolean;
  includeTimestamp?: boolean;
  theme?: 'light' | 'dark';
}

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToMarkdown = useCallback((result: SearchResult, options: ExportOptions = {}): string => {
    const { includeSources = true, includeTimestamp = true } = options;
    
    let markdown = `# ${result.query}\n\n`;
    
    if (includeTimestamp) {
      markdown += `*Generated on ${new Date(result.timestamp).toLocaleString()}*\n\n`;
    }
    
    markdown += `**Mode:** ${result.searchMode} | **Provider:** ${result.provider}\n\n`;
    markdown += `---\n\n`;
    markdown += `${result.answer}\n\n`;
    
    if (includeSources && result.sources.length > 0) {
      markdown += `## Sources\n\n`;
      result.sources.forEach((source: Source, index: number) => {
        markdown += `${index + 1}. [${source.title}](${source.url})\n`;
        if (source.snippet) {
          markdown += `   > ${source.snippet}\n`;
        }
        markdown += `\n`;
      });
    }
    
    return markdown;
  }, []);

  const exportToPDF = useCallback((result: SearchResult, options: ExportOptions = {}): jsPDF => {
    const { includeSources = true } = options;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(139, 92, 246); // Violet
    const titleLines = doc.splitTextToSize(result.query, maxWidth);
    doc.text(titleLines, margin, 30);
    
    // Metadata
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Mode: ${result.searchMode} | Provider: ${result.provider}`, margin, 45);
    doc.text(`Generated: ${new Date(result.timestamp).toLocaleString()}`, margin, 52);
    
    // Answer
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const answerLines = doc.splitTextToSize(result.answer, maxWidth);
    
    let yPos = 65;
    answerLines.forEach((line: string) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, margin, yPos);
      yPos += 5;
    });
    
    // Sources
    if (includeSources && result.sources.length > 0) {
      yPos += 10;
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(139, 92, 246);
      doc.text('Sources', margin, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      result.sources.forEach((source: Source, index: number) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        const sourceText = `${index + 1}. ${source.title}`;
        const sourceLines = doc.splitTextToSize(sourceText, maxWidth);
        
        sourceLines.forEach((line: string) => {
          doc.text(line, margin, yPos);
          yPos += 5;
        });
        
        doc.setTextColor(100, 100, 100);
        doc.text(source.url, margin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 8;
      });
    }
    
    return doc;
  }, []);

  const downloadMarkdown = useCallback((result: SearchResult, filename?: string) => {
    setIsExporting(true);
    try {
      const markdown = exportToMarkdown(result);
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `comet-search-${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }, [exportToMarkdown]);

  const downloadPDF = useCallback((result: SearchResult, filename?: string) => {
    setIsExporting(true);
    try {
      const doc = exportToPDF(result);
      doc.save(filename || `comet-search-${Date.now()}.pdf`);
    } finally {
      setIsExporting(false);
    }
  }, [exportToPDF]);

  const generateShareableHTML = useCallback((result: SearchResult): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${result.query}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; color: #333; }
    h1 { color: #8B5CF6; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px; }
    .meta { color: #6B7280; font-size: 14px; margin-bottom: 20px; }
    .answer { background: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0; white-space: pre-wrap; }
    .sources { margin-top: 30px; }
    .source { padding: 10px; border-bottom: 1px solid #E5E7EB; }
    .source a { color: #8B5CF6; text-decoration: none; }
    .source a:hover { text-decoration: underline; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #9CA3AF; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <h1>${result.query}</h1>
  <div class="meta">
    <strong>Mode:</strong> ${result.searchMode} | <strong>Provider:</strong> ${result.provider}<br>
    <strong>Date:</strong> ${new Date(result.timestamp).toLocaleString()}
  </div>
  <div class="answer">${result.answer.replace(/\n/g, '<br>')}</div>
  <div class="sources">
    <h2>Sources</h2>
    ${result.sources.map((s: Source, i: number) => `
      <div class="source">
        ${i + 1}. <a href="${s.url}" target="_blank">${s.title}</a> - ${s.domain}
      </div>
    `).join('')}
  </div>
  <div class="footer">Generated with Comet Search</div>
</body>
</html>
    `;
  }, []);

  const downloadHTML = useCallback((result: SearchResult, filename?: string) => {
    setIsExporting(true);
    try {
      const html = generateShareableHTML(result);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `comet-search-${Date.now()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }, [generateShareableHTML]);

  return {
    isExporting,
    exportToMarkdown,
    exportToPDF,
    generateShareableHTML,
    downloadMarkdown,
    downloadPDF,
    downloadHTML,
  };
}

export default useExport;
