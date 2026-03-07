/**
 * 日志工具
 * 根据环境控制日志输出级别
 */

const isDev = process.env.NODE_ENV === 'development';

/**
 * 日志级别
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 结构化日志条目
 */
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

/**
 * 格式化日志输出
 */
function formatLog(level: LogLevel, message: string, ...args: unknown[]): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    data: args.length > 0 ? args : undefined,
  };
}

/**
 * 日志对象
 * - debug: 仅在开发环境输出
 * - info: 始终输出
 * - warn: 始终输出
 * - error: 始终输出
 */
export const logger = {
  /**
   * 调试日志 - 仅在开发环境输出
   */
  debug: (message: string, ...args: unknown[]): void => {
    if (isDev) {
      const entry = formatLog('debug', message, ...args);
      console.log(`[DEBUG] ${entry.timestamp} ${message}`, ...args);
    }
  },

  /**
   * 信息日志
   */
  info: (message: string, ...args: unknown[]): void => {
    const entry = formatLog('info', message, ...args);
    console.info(`[INFO] ${entry.timestamp} ${message}`, ...args);
  },

  /**
   * 警告日志
   */
  warn: (message: string, ...args: unknown[]): void => {
    const entry = formatLog('warn', message, ...args);
    console.warn(`[WARN] ${entry.timestamp} ${message}`, ...args);
  },

  /**
   * 错误日志
   */
  error: (message: string, ...args: unknown[]): void => {
    const entry = formatLog('error', message, ...args);
    console.error(`[ERROR] ${entry.timestamp} ${message}`, ...args);
  },

  /**
   * 创建带上下文的日志记录器
   * @param context 上下文标识
   */
  withContext: (context: string) => ({
    debug: (message: string, ...args: unknown[]) => {
      if (isDev) {
        console.log(`[DEBUG:${context}] ${message}`, ...args);
      }
    },
    info: (message: string, ...args: unknown[]) => {
      console.info(`[INFO:${context}] ${message}`, ...args);
    },
    warn: (message: string, ...args: unknown[]) => {
      console.warn(`[WARN:${context}] ${message}`, ...args);
    },
    error: (message: string, ...args: unknown[]) => {
      console.error(`[ERROR:${context}] ${message}`, ...args);
    },
  }),
};

export default logger;
