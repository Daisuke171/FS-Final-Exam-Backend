import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrdersModule } from './orders/orders.module';
import { CodingWarModule } from './games/coding-war/coding-war.module';

@Module({
  imports: [OrdersModule, CodingWarModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
