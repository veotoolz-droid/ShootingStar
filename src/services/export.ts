/**
 * Export Service
 * Handles PDF, Markdown, and shareable page generation
 */

import jsPDF from 'jspdf';

export interface ExportData {
  title: string;
  query: string;
  answer: string;
  sources: Array<{
    title: string;
    url: string;
    domain: string;
  }>;
  timestamp: number;
  mode: string;
}

export function exportToMarkdown(data: ExportData): string {
  const date = new Date(data.timestamp).toLocaleString();
  
  let markdown = `# ${data.title}\n\n`;
  markdown += `**Query:** ${data.query}\n\n`;
  markdown += `**Mode:** ${data.mode}\n\n`;
  markdown += `**Date:** ${date}\n\n`;
  markdown += `---\n\n`;
  markdown += `## Answer\n\n${data.answer}\n\n`;
  markdown += `## Sources\n\n`;
  
  data.sources.forEach((source, index) => {
    markdown += `${index + 1}. [${source.title}](${source.url}) - ${source.domain}\n`;
  });
  
  return markdown;
}

export function downloadMarkdown(data: ExportData): void {
  const markdown = exportToMarkdown(data);
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `comet-search-${Date.now()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToPDF(data: ExportData): jsPDF {
  const doc = new jsPDF();
  const date = new Date(data.timestamp).toLocaleString();
  
  // Title
  doc.setFontSize(20);
  doc.text(data.title, 20, 20);
  
  // Metadata
  doc.setFontSize(12);
  doc.text(`Query: ${data.query}`, 20, 35);
  doc.text(`Mode: ${data.mode}`, 20, 42);
  doc.text(`Date: ${date}`, 20, 49);
  
  // Answer
  doc.setFontSize(14);
  doc.text('Answer:', 20, 65);
  doc.setFontSize(11);
  
  const splitAnswer = doc.splitTextToSize(data.answer, 170);
  doc.text(splitAnswer, 20, 72);
  
  // Sources
  let yPos = 72 + splitAnswer.length * 5 + 10;
  
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(14);
  doc.text('Sources:', 20, yPos);
  doc.setFontSize(10);
  
  yPos += 7;
  data.sources.forEach((source, index) => {
    const text = `${index + 1}. ${source.title} (${source.domain})`;
    const splitText = doc.splitTextToSize(text, 170);
    
    if (yPos + splitText.length * 4 > 280) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.text(splitText, 20, yPos);
    yPos += splitText.length * 4 + 3;
  });
  
  return doc;
}

export function downloadPDF(data: ExportData): void {
  const doc = exportToPDF(data);
  doc.save(`comet-search-${Date.now()}.pdf`);
}

export function generateShareableHTML(data: ExportData): string {
  const date = new Date(data.timestamp).toLocaleString();
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; color: #333; }
    h1 { color: #8B5CF6; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px; }
    .meta { color: #6B7280; font-size: 14px; margin-bottom: 20px; }
    .answer { background: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .sources { margin-top: 30px; }
    .source { padding: 10px; border-bottom: 1px solid #E5E7EB; }
    .source a { color: #8B5CF6; text-decoration: none; }
    .source a:hover { text-decoration: underline; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #9CA3AF; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <h1>${data.title}</h1>
  <div class="meta">
    <strong>Query:</strong> ${data.query}<br>
    <strong>Mode:</strong> ${data.mode}<br>
    <strong>Date:</strong> ${date}
  </div>
  <div class="answer">
    ${data.answer.replace(/\n/g, '<br>')}
  </div>
  <div class="sources">
    <h2>Sources</h2>
    ${data.sources.map((s, i) => `
      <div class="source">
        ${i + 1}. <a href="${s.url}" target="_blank">${s.title}</a> - ${s.domain}
      </div>
    `).join('')}
  </div>
  <div class="footer">
    Generated with Comet Search
  </div>
</body>
</html>
  `;
}

export function downloadShareablePage(data: ExportData): void {
  const html = generateShareableHTML(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `comet-search-${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default {
  exportToMarkdown,
  downloadMarkdown,
  exportToPDF,
  downloadPDF,
  generateShareableHTML,
  downloadShareablePage,
};
