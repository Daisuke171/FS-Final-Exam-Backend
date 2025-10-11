import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrdersModule } from './orders/orders.module';
import { CodingWarModule } from './modules/games/coding-war/coding-war.module';
import { RpsModule } from './modules/games/rock-paper-scissors/rps.module';
import { UserModule } from './modules/user/user.module';
import { ChatGateway } from './modules/chat/chat.gateway';

@Module({
  imports: [OrdersModule, CodingWarModule, RpsModule, UserModule],
  controllers: [AppController],
  providers: [AppService, ChatGateway],
})
export class AppModule {}
