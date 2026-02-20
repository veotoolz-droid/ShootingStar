/**
 * Auto-retry utility for API calls
 */

export interface RetryOptions {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
  shouldRetry?: (error: Error) => boolean;
}

const defaultOptions: RetryOptions = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: Error;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we should retry this error
      if (opts.shouldRetry && !opts.shouldRetry(lastError)) {
        throw lastError;
      }
      
      // Don't retry after last attempt
      if (attempt === opts.maxRetries) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = opts.delayMs * Math.pow(opts.backoffMultiplier, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Retry wrapper for fetch
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryOptions?: Partial<RetryOptions>
): Promise<Response> {
  return withRetry(() => fetch(url, options), retryOptions);
}

export default withRetry;
