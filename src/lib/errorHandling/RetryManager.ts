/**
 * RetryManager.ts — Issue #144
 * Exponential backoff retry logic for API calls.
 */

import { createLogger } from '../../utils/logger'

const logger = createLogger('RetryManager')

export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  jitter?: boolean
  onRetry?: (attempt: number, error: unknown) => void
}

export class RetryManager {
  private maxRetries: number
  private baseDelay: number
  private maxDelay: number
  private jitter: boolean

  constructor(options: RetryOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3
    this.baseDelay = options.baseDelay ?? 1000
    this.maxDelay = options.maxDelay ?? 30_000
    this.jitter = options.jitter ?? true
  }

  /**
   * Execute an operation with exponential backoff retry.
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const maxRetries = options.maxRetries ?? this.maxRetries
    const baseDelay = options.baseDelay ?? this.baseDelay
    let lastError: unknown

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error

        if (attempt === maxRetries || !this.isRetryable(error)) {
          throw error
        }

        const delay = this.calculateDelay(attempt, baseDelay)
        logger.warn(`Attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms`, {
          error: error instanceof Error ? error.message : String(error),
        })

        options.onRetry?.(attempt, error)
        await this.sleep(delay)
      }
    }

    throw lastError
  }

  private calculateDelay(attempt: number, baseDelay: number): number {
    const exponential = baseDelay * Math.pow(2, attempt - 1)
    const capped = Math.min(exponential, this.maxDelay)
    if (!this.jitter) return capped
    return capped * (0.9 + Math.random() * 0.2) // ±10% jitter
  }

  private isRetryable(error: unknown): boolean {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('network') || msg.includes('timeout') || msg.includes('fetch')) return true
    }
    // HTTP status codes that are retryable
    const status = (error as any)?.response?.status ?? (error as any)?.status
    if (status) return [408, 429, 500, 502, 503, 504].includes(status)
    return true
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Singleton instance
export const retryManager = new RetryManager()
