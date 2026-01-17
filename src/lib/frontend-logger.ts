/**
 * Frontend Logger - sends browser logs to backend with batching
 *
 * Usage:
 *   frontendLogger.info('[PageName]', 'Step 1: Processing', { stepId: 1 });
 *   frontendLogger.error('[PageName]', 'Failed to load', { error: err });
 * 
 * Logs are buffered and sent in batches to reduce network requests.
 * Default flush interval: 1 second or when buffer reaches 20 entries.
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  prefix: string;
  message: string;
  context?: Record<string, any>;
  timestamp: string;
  url: string;
  userAgent: string;
}

interface LogOptions {
  sendToBackend?: boolean; // Whether to send this log to backend (default: true for info/warn/error)
}

/** 默認刷新延遲（毫秒） */
const FLUSH_DELAY_MS = 1000;

/** 緩衝區最大條目數，超過自動重新整理 */
const MAX_BUFFER_SIZE = 20;

class FrontendLogger {
  private buffer: LogEntry[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  private addToBuffer(
    level: LogLevel,
    prefix: string,
    message: string,
    context?: Record<string, any>
  ) {
    const entry: LogEntry = {
      level,
      prefix,
      message,
      context,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    this.buffer.push(entry);

    // 如果緩衝區已滿，立即刷新
    if (this.buffer.length >= MAX_BUFFER_SIZE) {
      this.flush();
      return;
    }

    // 否則，安排延遲刷新
    this.scheduleFlush();
  }

  private scheduleFlush() {
    if (this.flushTimer) return; // 已有定時器

    this.flushTimer = setTimeout(() => {
      this.flush();
    }, FLUSH_DELAY_MS);
  }

  private flush() {
    // 清除定時器
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // 如果緩衝區為空，直接返回
    if (this.buffer.length === 0) return;

    // 取出所有日誌並清空緩衝區
    const logs = [...this.buffer];
    this.buffer = [];

    // 非同步發送，不阻塞主執行緒
    this.sendBatch(logs);
  }

  private async sendBatch(logs: LogEntry[]) {
    try {
      fetch('/api/logs/frontend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs }),
      }).catch((err) => {
        // Silently fail - don't disrupt user experience
        console.warn('Failed to send logs to backend:', err);
      });
    } catch (err) {
      // Silently fail
    }
  }

  info(prefix: string, message: string, context?: Record<string, any>, options: LogOptions = {}) {
    console.log(`${prefix} ${message}`, context || '');

    if (options.sendToBackend !== false) {
      this.addToBuffer('info', prefix, message, context);
    }
  }

  warn(prefix: string, message: string, context?: Record<string, any>, options: LogOptions = {}) {
    console.warn(`${prefix} ${message}`, context || '');

    if (options.sendToBackend !== false) {
      this.addToBuffer('warn', prefix, message, context);
    }
  }

  error(prefix: string, message: string, context?: Record<string, any>, options: LogOptions = {}) {
    console.error(`${prefix} ${message}`, context || '');

    if (options.sendToBackend !== false) {
      this.addToBuffer('error', prefix, message, context);
    }
  }

  /**
   * 立即重新整理緩衝區（用於頁面解除安裝等場景）
   */
  forceFlush() {
    this.flush();
  }
}

export const frontendLogger = new FrontendLogger();
