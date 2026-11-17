// =============================================================================
// Logger Utility
// Formatted runtime logging with timestamps, levels, and step-wise clarity
// =============================================================================

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export class Logger {
  // Step 1: Format log message with ISO timestamp and standardized log level
  private static format(level: LogLevel, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  // Step 2: Log informational runtime steps
  public static info(message: string, meta?: unknown): void {
    console.log(this.format('INFO', message, meta));
  }

  // Step 3: Log warning events and graceful fallbacks
  public static warn(message: string, meta?: unknown): void {
    console.warn(this.format('WARN', message, meta));
  }

  // Step 4: Log errors with peaceful context
  public static error(message: string, meta?: unknown): void {
    console.error(this.format('ERROR', message, meta));
  }

  // Step 5: Log debug details during development
  public static debug(message: string, meta?: unknown): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.format('DEBUG', message, meta));
    }
  }
}
