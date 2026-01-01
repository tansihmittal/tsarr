// Tool usage tracking for showing frequent tools first

const STORAGE_KEY = 'tsarr-tool-usage';

interface ToolUsage {
  [slug: string]: {
    count: number;
    lastUsed: number;
  };
}

export function getToolUsage(): ToolUsage {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function trackToolUsage(slug: string): void {
  if (typeof window === 'undefined') return;
  try {
    const usage = getToolUsage();
    usage[slug] = {
      count: (usage[slug]?.count || 0) + 1,
      lastUsed: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  } catch {
    // Ignore storage errors
  }
}

export function getFrequentTools(limit: number = 8): string[] {
  const usage = getToolUsage();
  return Object.entries(usage)
    .sort((a, b) => {
      // Sort by count first, then by recency
      if (b[1].count !== a[1].count) {
        return b[1].count - a[1].count;
      }
      return b[1].lastUsed - a[1].lastUsed;
    })
    .slice(0, limit)
    .map(([slug]) => slug);
}

export function sortToolsByUsage<T extends { slug: string }>(tools: T[]): T[] {
  const usage = getToolUsage();
  return [...tools].sort((a, b) => {
    const aUsage = usage[a.slug];
    const bUsage = usage[b.slug];
    
    // Tools with usage come first
    if (aUsage && !bUsage) return -1;
    if (!aUsage && bUsage) return 1;
    if (!aUsage && !bUsage) return 0;
    
    // Sort by count, then recency
    if (bUsage.count !== aUsage.count) {
      return bUsage.count - aUsage.count;
    }
    return bUsage.lastUsed - aUsage.lastUsed;
  });
}
