import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrdersModule } from './orders/orders.module';
import { CodingWarModule } from './games/coding-war/coding-war.module';
import { RpsModule } from './games/rock-paper-scissors/rps.module';

@Module({
  imports: [OrdersModule, CodingWarModule, RpsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
