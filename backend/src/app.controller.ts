import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** Public so `GET /api/v1` works without a JWT (health / sanity check). */
  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
