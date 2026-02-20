/**
 * Web Page Summarization Service
 * Uses Readability.js to extract content and LLM to summarize
 */

export interface PageSummary {
  title: string;
  summary: string;
  keyPoints: string[];
  readingTime: number;
  url: string;
}

export async function extractPageContent(url: string): Promise<{
  title: string;
  content: string;
  excerpt: string;
}> {
  try {
    // Use a CORS proxy or fetch directly
    const response = await fetch(`https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }
    
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    const title = lines[0] || 'Untitled';
    const content = lines.slice(1).join('\n');
    const excerpt = content.slice(0, 200) + (content.length > 200 ? '...' : '');
    
    return { title, content, excerpt };
  } catch (error) {
    console.error('Error extracting page content:', error);
    throw error;
  }
}

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export async function generateSummary(
  content: string,
  llmConfig: { url: string; model: string; apiKey?: string }
): Promise<PageSummary> {
  const systemPrompt = `You are a professional summarizer. Create a concise summary of the provided content.

Guidelines:
- Provide a 2-3 paragraph summary
- Extract 3-5 key bullet points
- Be objective and accurate
- Preserve important facts and figures`;

  const userPrompt = `Please summarize the following content:

${content.slice(0, 8000)}`; // Limit content length

  try {
    const response = await fetch(llmConfig.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(llmConfig.apiKey && { 'Authorization': `Bearer ${llmConfig.apiKey}` }),
      },
      body: JSON.stringify({
        model: llmConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM error: ${response.status}`);
    }

    const data = await response.json();
    const summaryText = data.choices?.[0]?.message?.content || '';
    
    // Parse summary and key points
    const lines = summaryText.split('\n').filter(l => l.trim());
    const summary = lines.filter(l => !l.startsWith('-') && !l.startsWith('•')).join('\n\n');
    const keyPoints = lines
      .filter(l => l.startsWith('-') || l.startsWith('•'))
      .map(l => l.replace(/^[-•]\s*/, '').trim())
      .slice(0, 5);

    return {
      title: 'Page Summary',
      summary,
      keyPoints,
      readingTime: calculateReadingTime(content),
      url: '',
    };
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
}

export async function summarizePage(
  url: string,
  llmConfig: { url: string; model: string; apiKey?: string }
): Promise<PageSummary> {
  const { title, content } = await extractPageContent(url);
  const summary = await generateSummary(content, llmConfig);
  
  return {
    ...summary,
    title,
    url,
  };
}

export default summarizePage;
