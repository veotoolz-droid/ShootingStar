import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-secondary rounded ${className}`}
      style={{
        background: 'linear-gradient(90deg, hsl(var(--secondary)) 25%, hsl(var(--muted)) 50%, hsl(var(--secondary)) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

export function SearchResultSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Answer skeleton */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-16 h-3 ml-auto" />
        </div>
        <div className="space-y-2">
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-[95%] h-4" />
          <Skeleton className="w-[90%] h-4" />
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-[85%] h-4" />
          <Skeleton className="w-[92%] h-4" />
        </div>
      </div>

      {/* Sources skeleton */}
      <div className="space-y-3">
        <Skeleton className="w-24 h-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-card border border-border rounded-xl space-y-3">
            <div className="flex items-start gap-3">
              <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-3/4 h-4" />
                <Skeleton className="w-full h-3" />
                <Skeleton className="w-1/2 h-3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TabSkeleton() {
  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-secondary/50 border-b border-border">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg min-w-[120px] max-w-[200px]">
          <Skeleton className="w-3.5 h-3.5 rounded-full" />
          <Skeleton className="flex-1 h-4" />
          <Skeleton className="w-3 h-3 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function BrowserSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
      {/* URL bar skeleton */}
      <div className="flex gap-2">
        <Skeleton className="flex-1 h-10 rounded-lg" />
        <Skeleton className="w-24 h-10 rounded-lg" />
      </div>

      {/* Action buttons skeleton */}
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="p-4 space-y-3">
      <Skeleton className="w-20 h-4" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-3 rounded-lg space-y-2">
          <Skeleton className="w-3/4 h-4" />
          <div className="flex gap-2">
            <Skeleton className="w-12 h-3" />
            <Skeleton className="w-16 h-3" />
            <Skeleton className="w-10 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CommandPaletteSkeleton() {
  return (
    <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <Skeleton className="w-full h-10 rounded-lg" />
      </div>
      <div className="p-2 space-y-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="flex-1 h-4" />
            <Skeleton className="w-8 h-4 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Skeleton;
