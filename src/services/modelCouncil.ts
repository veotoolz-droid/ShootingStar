/**
 * Model Council Service
 * Runs multiple models in parallel and compares outputs
 */

import { KimiMessage } from './search';

export interface CouncilModel {
  id: string;
  name: string;
  provider: 'kimi' | 'local' | 'openai';
  modelId: string;
  color: string;
}

export interface CouncilResponse {
  modelId: string;
  content: string;
  isLoading: boolean;
  error?: string;
  timestamp?: number;
}

export interface CouncilResult {
  query: string;
  responses: CouncilResponse[];
  consensus?: string;
  disagreements?: string[];
  bestResponseId?: string;
  votingResults?: Record<string, number>;
}

export const AVAILABLE_COUNCIL_MODELS: CouncilModel[] = [
  {
    id: 'kimi-k2',
    name: 'Kimi K2.5',
    provider: 'kimi',
    modelId: 'kimi-k2-0711-preview',
    color: '#8B5CF6', // violet
  },
  {
    id: 'kimi-moonshot',
    name: 'Moonshot v1',
    provider: 'kimi',
    modelId: 'moonshot-v1-8k',
    color: '#3B82F6', // blue
  },
  {
    id: 'local-qwen',
    name: 'Local Qwen',
    provider: 'local',
    modelId: 'qwen2.5-14b',
    color: '#10B981', // emerald
  },
];

class ModelCouncilService {
  private abortControllers: Map<string, AbortController> = new Map();

  async runCouncil(
    query: string,
    modelIds: string[],
    apiKeys: { kimi?: string; openai?: string },
    localUrl?: string,
    onUpdate?: (result: CouncilResult) => void
  ): Promise<CouncilResult> {
    const models = AVAILABLE_COUNCIL_MODELS.filter(m => modelIds.includes(m.id));
    
    const result: CouncilResult = {
      query,
      responses: models.map(m => ({
        modelId: m.id,
        content: '',
        isLoading: true,
      })),
    };

    // Run all models in parallel
    const promises = models.map(async (model) => {
      const controller = new AbortController();
      this.abortControllers.set(model.id, controller);

      try {
        await this.runModel(
          model,
          query,
          apiKeys,
          localUrl,
          (chunk) => {
            const resp = result.responses.find(r => r.modelId === model.id);
            if (resp) {
              resp.content += chunk;
              onUpdate?.({ ...result });
            }
          },
          controller.signal
        );

        const resp = result.responses.find(r => r.modelId === model.id);
        if (resp) {
          resp.isLoading = false;
          resp.timestamp = Date.now();
        }
      } catch (error) {
        const resp = result.responses.find(r => r.modelId === model.id);
        if (resp) {
          resp.isLoading = false;
          resp.error = error instanceof Error ? error.message : 'Unknown error';
        }
      } finally {
        this.abortControllers.delete(model.id);
      }

      onUpdate?.({ ...result });
    });

    await Promise.all(promises);

    // Generate consensus analysis
    result.consensus = this.analyzeConsensus(result.responses);
    result.disagreements = this.identifyDisagreements(result.responses);

    return result;
  }

  private async runModel(
    model: CouncilModel,
    query: string,
    apiKeys: { kimi?: string; openai?: string },
    localUrl?: string,
    onChunk?: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const messages: KimiMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant. Provide accurate, well-reasoned answers.'
      },
      {
        role: 'user',
        content: query
      }
    ];

    let fullResponse = '';

    switch (model.provider) {
      case 'kimi':
        if (!apiKeys.kimi) {
          throw new Error('Kimi API key not provided');
        }
        
        // For now, just fetch without streaming for simplicity
        const kimiResponse = await fetch('https://api.moonshot.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKeys.kimi}`,
          },
          body: JSON.stringify({
            model: model.modelId,
            messages,
            stream: false,
          }),
          signal,
        });

        if (!kimiResponse.ok) {
          throw new Error(`Kimi API error: ${kimiResponse.status}`);
        }

        const kimiData = await kimiResponse.json();
        fullResponse = kimiData.choices?.[0]?.message?.content || '';
        onChunk?.(fullResponse);
        break;

      case 'local':
        if (!localUrl) {
          throw new Error('Local LLM URL not provided');
        }
        // Stream from local LLM
        const response = await fetch(localUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: model.modelId,
            messages,
            stream: true,
          }),
          signal,
        });

        if (!response.ok) {
          throw new Error(`Local LLM error: ${response.status}`);
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
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  onChunk?.(content);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
        break;

      default:
        throw new Error(`Unknown provider: ${model.provider}`);
    }

    return fullResponse;
  }

  private analyzeConsensus(responses: CouncilResponse[]): string {
    const completed = responses.filter(r => !r.isLoading && !r.error && r.content);
    if (completed.length < 2) return 'Insufficient responses for consensus analysis.';

    // Simple heuristic: check if responses mention similar key terms
    const allTerms = completed.map(r => {
      return r.content.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 4);
    });

    const commonTerms = allTerms[0].filter(term => 
      allTerms.every(terms => terms.includes(term))
    );

    if (commonTerms.length > 5) {
      return `Models agree on key points including: ${commonTerms.slice(0, 5).join(', ')}.`;
    }

    return 'Models provide different perspectives on this topic.';
  }

  private identifyDisagreements(responses: CouncilResponse[]): string[] {
    const completed = responses.filter(r => !r.isLoading && !r.error && r.content);
    if (completed.length < 2) return [];

    const disagreements: string[] = [];

    // Check for contradictory statements (simplified)
    const hasContradiction = completed.some((r1, i) => 
      completed.slice(i + 1).some(r2 => {
        // Simple check: if one says "yes" and other says "no"
        const c1 = r1.content.toLowerCase();
        const c2 = r2.content.toLowerCase();
        return (c1.includes('yes') && c2.includes('no')) || 
               (c1.includes('no') && c2.includes('yes'));
      })
    );

    if (hasContradiction) {
      disagreements.push('Models appear to disagree on key facts.');
    }

    return disagreements;
  }

  voteForBest(result: CouncilResult, modelId: string): CouncilResult {
    if (!result.votingResults) {
      result.votingResults = {};
    }
    
    result.votingResults[modelId] = (result.votingResults[modelId] || 0) + 1;
    
    // Find winner
    let maxVotes = 0;
    let winner = '';
    
    for (const [id, votes] of Object.entries(result.votingResults)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        winner = id;
      }
    }
    
    result.bestResponseId = winner;
    return result;
  }

  abortAll(): void {
    for (const [id, controller] of this.abortControllers) {
      controller.abort();
      this.abortControllers.delete(id);
    }
  }

  abortModel(modelId: string): void {
    const controller = this.abortControllers.get(modelId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(modelId);
    }
  }
}

// Singleton instance
let councilServiceInstance: ModelCouncilService | null = null;

export function getModelCouncilService(): ModelCouncilService {
  if (!councilServiceInstance) {
    councilServiceInstance = new ModelCouncilService();
  }
  return councilServiceInstance;
}

export function resetModelCouncilService(): void {
  councilServiceInstance?.abortAll();
  councilServiceInstance = null;
}

export default ModelCouncilService;
