import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ChatService } from './chat.service';
import { ChatMessage } from './models/chat-message.model';
import { SendMessageInput } from './dto/send-message.input';

@Resolver(() => ChatMessage)
export class ChatResolver {
  constructor(private readonly chat: ChatService) {}

  @Query(() => [ChatMessage])
  messages(@Args('chatId', { type: () => ID }) chatId: string) {
    return this.chat.getMessages(chatId);
  }

  @Mutation(() => ChatMessage)
  sendMessage(@Args('input') input: SendMessageInput) {    
    return this.chat.sendMessage(input);
  }

  @Mutation(() => ChatMessage)
  markMessageRead(
    @Args('chatId', { type: () => ID }) chatId: string,
    @Args('messageId', { type: () => ID }) messageId: string,
  ) {
    return this.chat.markRead(chatId, messageId);
  }
}
