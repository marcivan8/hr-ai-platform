export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, ...args: any[]): void {
    console.log(`[${new Date().toISOString()}] [${this.context}] INFO:`, message, ...args);
  }

  error(message: string, error?: any): void {
    console.error(`[${new Date().toISOString()}] [${this.context}] ERROR:`, message);
    if (error) {
      console.error(error);
    }
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[${new Date().toISOString()}] [${this.context}] WARN:`, message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${new Date().toISOString()}] [${this.context}] DEBUG:`, message, ...args);
    }
  }
}
