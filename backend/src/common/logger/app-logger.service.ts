import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppLoggerService {
  private readonly logger = new Logger(AppLoggerService.name);

  log(message: string, context?: string): void {
    if (context) {
      this.logger.log(message, context);
    } else {
      this.logger.log(message);
    }
  }

  error(message: string, trace?: string, context?: string): void {
    if (context) {
      this.logger.error(message, trace, context);
    } else {
      this.logger.error(message, trace);
    }
  }

  warn(message: string, context?: string): void {
    if (context) {
      this.logger.warn(message, context);
    } else {
      this.logger.warn(message);
    }
  }
}
