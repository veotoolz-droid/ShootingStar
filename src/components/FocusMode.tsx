import React, { useState } from 'react';
import { X, Eye, Moon, Sun, Highlighter, Type, AlignLeft } from 'lucide-react';
import { PageSummary } from '../hooks/usePageSummarizer';

interface FocusModeProps {
  isOpen: boolean;
  onClose: () => void;
  content?: PageSummary;
  htmlContent?: string;
}

export function FocusMode({ isOpen, onClose, content, htmlContent }: FocusModeProps) {
  const [fontSize, setFontSize] = useState(16);
  const [isDark, setIsDark] = useState(false);
  const [showHighlights, setShowHighlights] = useState(true);

  if (!isOpen) return null;

  const displayContent = content || (htmlContent ? { 
    title: 'Reading View', 
    content: htmlContent,
    excerpt: '',
    length: htmlContent.length 
  } : null);

  if (!displayContent) {
    return (
      <div className="fixed inset-0 z-[100] bg-background">
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No content to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[100] transition-colors ${isDark ? 'bg-[#1a1a1a] text-gray-200' : 'bg-white text-gray-900'}`}>
      {/* Toolbar */}
      <div className={`fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-violet-500" />
          <span className="font-medium">Focus Mode</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Font size */}
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            <input
              type="range"
              min="12"
              max="24"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-24"
            />
          </div>

          {/* Highlights toggle */}
          <button
            onClick={() => setShowHighlights(!showHighlights)}
            className={`p-2 rounded-lg ${showHighlights ? 'bg-violet-500/20 text-violet-500' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            <Highlighter className="w-4 h-4" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div 
        className="h-full overflow-y-auto pt-16"
        style={{ 
          fontSize: `${fontSize}px`,
          lineHeight: '1.8',
        }}
      >
        <article className="max-w-3xl mx-auto px-6 py-12">
          <header className="mb-12">
            <h1 className="text-4xl font-bold mb-4">{displayContent.title}</h1>
            {displayContent.byline && (
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                By {displayContent.byline}
              </p>
            )}
            {displayContent.excerpt && (
              <p className={`text-xl mt-6 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {displayContent.excerpt}
              </p>
            )}
          </header>

          <div 
            className="prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: displayContent.content }}
          />

          {showHighlights && (
            <div className={`mt-12 p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <h3 className="flex items-center gap-2 font-medium mb-4">
                <AlignLeft className="w-5 h-5 text-violet-500" />
                AI Annotations
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                AI annotations would appear here in a full implementation, highlighting key passages 
                and providing contextual notes in the margins.
              </p>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}

export default FocusMode;
