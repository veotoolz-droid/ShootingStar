/**
 * Deep Research Service
 * Iterative research with AI planning and follow-up queries
 */

import { braveSearch, enrichSources, Source } from './search';

export interface ResearchPlan {
  originalQuery: string;
  subQueries: string[];
  expectedOutcomes: string[];
  searchStrategy: 'breadth' | 'depth' | 'mixed';
}

export interface ResearchStep {
  id: number;
  query: string;
  sources: Source[];
  findings: string;
  gaps: string[];
  nextQueries: string[];
  isComplete: boolean;
}

export interface ResearchReport {
  query: string;
  summary: string;
  keyFindings: string[];
  sources: Source[];
  steps: ResearchStep[];
  confidence: number;
  gapsRemaining: string[];
}

export interface DeepResearchOptions {
  maxSteps: number;
  minSources: number;
  braveApiKey: string;
  onStep?: (step: ResearchStep) => void;
  onProgress?: (progress: number) => void;
}

class DeepResearchService {
  private abortController: AbortController | null = null;

  abort(): void {
    this.abortController?.abort();
  }

  async executeResearch(
    query: string,
    options: DeepResearchOptions
  ): Promise<ResearchReport> {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const steps: ResearchStep[] = [];
    const allSources: Map<string, Source> = new Map();
    let currentQuery = query;
    let stepCount = 0;

    // Initial search
    options.onProgress?.(0.1);
    
    while (stepCount < options.maxSteps) {
      if (signal.aborted) {
        throw new Error('Research aborted');
      }

      stepCount++;
      options.onProgress?.(0.1 + (stepCount / options.maxSteps) * 0.7);

      // Search for current query
      const searchResults = await braveSearch(currentQuery, options.braveApiKey, 'deep');
      const enriched = await enrichSources(searchResults);

      // Add to source collection
      enriched.forEach(source => {
        allSources.set(source.url, source);
      });

      // Analyze findings (in real implementation, this would use LLM)
      const findings = this.analyzeFindings(enriched, currentQuery);
      const gaps = this.identifyGaps(findings, query);
      const nextQueries = this.generateFollowUpQueries(gaps, query);

      const step: ResearchStep = {
        id: stepCount,
        query: currentQuery,
        sources: enriched,
        findings,
        gaps,
        nextQueries,
        isComplete: gaps.length === 0 || stepCount >= options.maxSteps,
      };

      steps.push(step);
      options.onStep?.(step);

      // Check if we should continue
      if (gaps.length === 0 || nextQueries.length === 0) {
        break;
      }

      // Select next query based on strategy
      currentQuery = nextQueries[0];
    }

    options.onProgress?.(0.9);

    // Generate final report
    const report = this.generateReport(query, steps, Array.from(allSources.values()));
    
    options.onProgress?.(1.0);
    
    return report;
  }

  private analyzeFindings(sources: Source[], query: string): string {
    // In real implementation, use LLM to analyze
    return `Analysis of ${sources.length} sources for "${query}"`;
  }

  private identifyGaps(_findings: string, originalQuery: string): string[] {
    // In real implementation, use LLM to identify gaps
    const gaps: string[] = [];
    
    // Check if findings cover key aspects of query
    const aspects = originalQuery.toLowerCase().split(' ');
    
    // Simple heuristic: if query has multiple words, check coverage
    if (aspects.length > 3) {
      gaps.push(`More detailed information about ${aspects.slice(0, 2).join(' ')}`);
    }
    
    return gaps;
  }

  private generateFollowUpQueries(gaps: string[], originalQuery: string): string[] {
    return gaps.map(gap => `${originalQuery} ${gap}`);
  }

  private generateReport(
    query: string,
    steps: ResearchStep[],
    allSources: Source[]
  ): ResearchReport {
    // Deduplicate sources
    const uniqueSources = Array.from(
      new Map(allSources.map(s => [s.url, s])).values()
    );

    // Extract key findings from steps
    const keyFindings = steps
      .filter(s => s.findings)
      .map(s => s.findings)
      .slice(0, 5);

    // Calculate confidence based on coverage
    const confidence = Math.min(0.95, steps.length * 0.2 + uniqueSources.length * 0.05);

    // Collect remaining gaps
    const gapsRemaining = steps[steps.length - 1]?.gaps || [];

    return {
      query,
      summary: `Deep research completed with ${steps.length} steps and ${uniqueSources.length} unique sources.`,
      keyFindings,
      sources: uniqueSources,
      steps,
      confidence,
      gapsRemaining,
    };
  }

  async generateResearchPlan(query: string): Promise<ResearchPlan> {
    // In real implementation, use LLM to generate plan
    const words = query.split(' ');
    
    return {
      originalQuery: query,
      subQueries: [
        `${query} overview`,
        `${query} details`,
        `${query} examples`,
      ],
      expectedOutcomes: [
        'Comprehensive understanding of topic',
        'Multiple perspectives identified',
        'Key facts and figures extracted',
      ],
      searchStrategy: words.length > 5 ? 'depth' : 'breadth',
    };
  }
}

// Singleton instance
let researchServiceInstance: DeepResearchService | null = null;

export function getDeepResearchService(): DeepResearchService {
  if (!researchServiceInstance) {
    researchServiceInstance = new DeepResearchService();
  }
  return researchServiceInstance;
}

export default DeepResearchService;
