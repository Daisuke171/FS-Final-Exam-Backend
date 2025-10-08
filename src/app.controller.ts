import { Controller, Get } from '@nestjs/common';


@Controller('status')
export class AppController {
  @Get()
  getHello(): string {
    return 'Hello World!';
  }

}
