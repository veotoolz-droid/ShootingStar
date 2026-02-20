// Brave Search API integration
const BRAVE_API_URL = 'https://api.search.brave.com/res/v1/web/search';

export interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
}

export interface Source {
  title: string;
  url: string;
  domain: string;
  snippet?: string;
  content?: string;
}

export interface KimiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
export type ProviderMode = 'local' | 'kimi' | 'hybrid';
export type SearchMode = 'quick' | 'deep' | 'reasoning';

// Search configuration based on mode
const SEARCH_CONFIG: Record<SearchMode, { count: number; depth: number; description: string }> = {
  quick: {
    count: 3,
    depth: 1,
    description: 'Fast answers from 1-2 sources'
  },
  deep: {
    count: 10,
    depth: 3,
    description: 'Comprehensive research from multiple sources'
  },
  reasoning: {
    count: 5,
    depth: 2,
    description: 'Step-by-step analysis with citations'
  }
};

// Perform Brave search
export async function braveSearch(
  query: string, 
  apiKey: string, 
  mode: SearchMode = 'quick'
): Promise<Source[]> {
  const config = SEARCH_CONFIG[mode];
  
  try {
    const response = await fetch(
      `${BRAVE_API_URL}?q=${encodeURIComponent(query)}&count=${config.count}`,
      {
        headers: {
          'X-Subscription-Token': apiKey,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Brave API error: ${response.status}`);
    }

    const data = await response.json();
    
    return (data.web?.results || []).map((result: any) => ({
      title: result.title,
      url: result.url,
      domain: new URL(result.url).hostname.replace('www.', ''),
      snippet: result.description,
      content: result.description
    }));
  } catch (error) {
    console.error('Brave search error:', error);
    throw error;
  }
}

// Fetch and extract content from a webpage
export async function fetchPageContent(url: string): Promise<string> {
  try {
    // Use a CORS proxy or your own backend
    const proxyUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      return '';
    }
    
    return await response.text();
  } catch (error) {
    console.error('Failed to fetch page content:', error);
    return '';
  }
}

// Enrich sources with full content
export async function enrichSources(sources: Source[]): Promise<Source[]> {
  const enriched = await Promise.all(
    sources.slice(0, 3).map(async (source) => {
      const content = await fetchPageContent(source.url);
      return { ...source, content: content || source.snippet };
    })
  );
  
  return enriched;
}

// Get search mode configuration
export function getSearchConfig(mode: SearchMode) {
  return SEARCH_CONFIG[mode];
}

// Kimi API configuration
export const KIMI_CONFIG = {
  url: 'https://api.moonshot.cn/v1/chat/completions',
  model: 'kimi-k2-0711-preview'  // Latest Kimi model
};

// Provider configuration
export interface ProviderConfig {
  name: string;
  url: string;
  model: string;
  apiKey?: string;
}

// Determine which provider to use based on mode and query complexity
export function selectProvider(
  providerMode: ProviderMode,
  searchMode: SearchMode,
  localConfig: ProviderConfig,
  kimiApiKey?: string
): { provider: 'local' | 'kimi'; config: ProviderConfig } {
  switch (providerMode) {
    case 'local':
      return { provider: 'local', config: localConfig };
    
    case 'kimi':
      if (!kimiApiKey) {
        throw new Error('Kimi API key not configured');
      }
      return {
        provider: 'kimi',
        config: {
          name: 'Kimi API',
          url: KIMI_CONFIG.url,
          model: KIMI_CONFIG.model,
          apiKey: kimiApiKey
        }
      };
    
    case 'hybrid':
      // Use Kimi for deep/reasoning modes, local for quick
      if (searchMode === 'deep' || searchMode === 'reasoning') {
        if (kimiApiKey) {
          return {
            provider: 'kimi',
            config: {
              name: 'Kimi API',
              url: KIMI_CONFIG.url,
              model: KIMI_CONFIG.model,
              apiKey: kimiApiKey
            }
          };
        }
      }
      return { provider: 'local', config: localConfig };
    
    default:
      return { provider: 'local', config: localConfig };
  }
}

// Stream LLM response from either local or Kimi API
export async function* streamLLMResponse(
  query: string,
  sources: Source[],
  config: ProviderConfig,
  searchMode: SearchMode,
  onError: (msg: string) => void
): AsyncGenerator<string, void, unknown> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  // Build context from sources
  const contextText = sources
    .map((s, i) => `[${i + 1}] ${s.title}\n${s.content || s.snippet}`)
    .join('\n\n');

  // Mode-specific system prompts
  const systemPrompts: Record<SearchMode, string> = {
    quick: `You are a helpful AI search assistant. Provide a concise, accurate answer based on the provided sources. Cite sources using [1], [2], etc. Be brief but informative.`,
    
    deep: `You are a thorough research assistant. Analyze the provided sources deeply and synthesize a comprehensive answer. 
- Identify key themes and patterns across sources
- Provide detailed explanations with specific facts and figures
- Cite all claims with source numbers [1], [2], etc.
- Structure the response with clear sections
- Include a brief summary at the end`,
    
    reasoning: `You are an analytical reasoning assistant. Break down the query step-by-step:
1. First, identify the key components of the question
2. Analyze what each source contributes to the answer
3. Reason through any contradictions or uncertainties
4. Provide a well-reasoned conclusion
5. Cite sources throughout using [1], [2], etc.

Show your reasoning process clearly.`
  };

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: systemPrompts[searchMode]
          },
          {
            role: 'user',
            content: `Sources:\n${contextText}\n\nQuery: ${query}\n\nPlease provide a ${searchMode} answer based on these sources.`
          }
        ],
        stream: true,
        temperature: searchMode === 'reasoning' ? 0.3 : 0.7,
        max_tokens: searchMode === 'deep' ? 4000 : 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}
