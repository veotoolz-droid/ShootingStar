import { useState } from 'react';
import { X, Search, Clock, Trash2, ArrowRight } from 'lucide-react';
import { SearchHistoryItem } from '../hooks/useSearchHistory';

interface SearchHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: SearchHistoryItem[];
  onSelectQuery: (query: string) => void;
  onClearHistory: () => void;
  onRemoveItem: (id: string) => void;
}

export function SearchHistoryPanel({
  isOpen,
  onClose,
  history,
  onSelectQuery,
  onClearHistory,
  onRemoveItem,
}: SearchHistoryPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // Filter and group history
  const filteredHistory = searchTerm.trim()
    ? history.filter(item =>
        item.query.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : history;

  const grouped = filteredHistory.reduce((acc, item) => {
    const date = new Date(item.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let group: string;
    if (date.toDateString() === today.toDateString()) {
      group = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      group = 'Yesterday';
    } else if (today.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      group = 'This Week';
    } else {
      group = 'Earlier';
    }

    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, SearchHistoryItem[]>);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg max-h-[80vh] bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-500" />
            Search History
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search history..."
              autoFocus
              className="w-full pl-10 pr-4 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{searchTerm ? 'No matching searches found' : 'No search history yet'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([group, items]) => (
                <div key={group}>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    {group}
                  </h4>
                  <div className="space-y-1">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 group"
                      >
                        <button
                          onClick={() => { onSelectQuery(item.query); onClose(); }}
                          className="flex-1 flex items-center gap-2 text-left"
                        >
                          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="flex-1 truncate">{item.query}</span>
                          <span className="text-xs text-muted-foreground">{formatTime(item.timestamp)}</span>
                        </button>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-red-500 rounded transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="p-4 border-t border-border bg-secondary/30">
            <button
              onClick={onClearHistory}
              className="text-sm text-red-500 hover:text-red-600 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear all history
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchHistoryPanel;
