import { LoggerService } from '@common/logger/logger.service';
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor(private readonly loggerService: LoggerService) {}
  @Get()
  async getHello() {
    await this.loggerService.info('Doston tel qilchi');
  }
}
