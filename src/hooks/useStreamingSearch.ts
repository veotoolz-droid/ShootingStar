import { useState, useEffect, useCallback, useRef } from 'react';
import { getMockResponse } from '../mockData';

export interface Source {
  id: number;
  title: string;
  url: string;
  domain: string;
  snippet: string;
}

export interface SearchResult {
  query: string;
  response: string;
  sources: Source[];
  isComplete: boolean;
}

export function useStreamingSearch() {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [currentQuery, setCurrentQuery] = useState('');
  
  const abortRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const streamText = useCallback(async (text: string, onUpdate: (char: string) => void) => {
    abortRef.current = false;
    const chars = text.split('');
    
    for (let i = 0; i < chars.length; i++) {
      if (abortRef.current) break;
      
      onUpdate(chars[i]);
      
      // Variable delay for more natural typing effect
      const delay = Math.random() * 15 + 5; // 5-20ms
      await new Promise(resolve => {
        timeoutRef.current = setTimeout(resolve, delay);
      });
    }
  }, []);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    // Abort any ongoing search
    abortRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsSearching(true);
    setCurrentQuery(query);
    setDisplayedText('');
    
    // Get mock response
    const { response, sources } = getMockResponse(query);
    
    // Initialize result with sources
    setResult({
      query,
      response: '',
      sources,
      isComplete: false,
    });
    
    // Stream the response text
    let accumulatedText = '';
    await streamText(response, (char) => {
      accumulatedText += char;
      setDisplayedText(accumulatedText);
    });
    
    // Mark as complete
    setResult(prev => prev ? {
      ...prev,
      response: accumulatedText,
      isComplete: true,
    } : null);
    
    setIsSearching(false);
  }, [streamText]);

  const stopSearch = useCallback(() => {
    abortRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsSearching(false);
    setResult(prev => prev ? {
      ...prev,
      isComplete: true,
    } : null);
  }, []);

  const clearResult = useCallback(() => {
    abortRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setResult(null);
    setDisplayedText('');
    setCurrentQuery('');
    setIsSearching(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    result,
    isSearching,
    displayedText,
    currentQuery,
    performSearch,
    stopSearch,
    clearResult,
  };
}
