import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatResolver } from './chat.resolver';

@Module({
  providers: [ChatGateway, ChatService, ChatResolver],
  exports: [ChatService],
})
export class ChatModule {}