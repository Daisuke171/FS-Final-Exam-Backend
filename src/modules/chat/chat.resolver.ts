import { Resolver, Query, Mutation, Args, Subscription } from '@nestjs/graphql';
import { ChatService } from './chat.service';
import { ChatMessage } from './models/chat-message.model';
import { PubSub } from 'graphql-subscriptions';
import { Observable } from 'rxjs';

const pubSub = new PubSub();

@Resolver(() => ChatMessage)
export class ChatResolver {
  constructor(private readonly chatService: ChatService) {}

  @Mutation(() => ChatMessage)
  async sendMessage(
    @Args('chatId') chatId: string,
    @Args('senderId') senderId: string,
    @Args('message') message: string,
  ) {
    const msg = await this.chatService.createMessage(chatId, senderId, message);
    pubSub.publish('messageAdded', { messageAdded: msg });
    return msg;
  }

  @Subscription(() => ChatMessage, {
    resolve: (value) => value.messageAdded,
  })
  messageAdded() {
    return pubSub.asyncIterator('messageAdded');
  }

  // Ejemplo de Observable conectado con RxJS
  @Query(() => [ChatMessage])
  getMessages(@Args('chatId') chatId: string): Observable<ChatMessage[]> {
    return this.chatService.getMessages(chatId);
  }
}
