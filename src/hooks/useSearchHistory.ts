import { useState, useEffect, useCallback } from 'react';

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
}

const STORAGE_KEY = 'comet-search-history';
const MAX_HISTORY_ITEMS = 50;

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      } catch (error) {
        console.error('Failed to save search history:', error);
      }
    }
  }, [history, isLoaded]);

  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    
    setHistory(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(item => item.query.toLowerCase() !== query.toLowerCase());
      
      // Add new item at the beginning
      const newItem: SearchHistoryItem = {
        id: Date.now().toString(),
        query: query.trim(),
        timestamp: Date.now(),
      };
      
      // Keep only the most recent items
      return [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const searchHistory = useCallback((searchTerm: string): SearchHistoryItem[] => {
    if (!searchTerm.trim()) return history;
    
    const lowerTerm = searchTerm.toLowerCase();
    return history.filter(item => 
      item.query.toLowerCase().includes(lowerTerm)
    );
  }, [history]);

  return {
    history,
    isLoaded,
    addToHistory,
    removeFromHistory,
    clearHistory,
    searchHistory,
  };
}
