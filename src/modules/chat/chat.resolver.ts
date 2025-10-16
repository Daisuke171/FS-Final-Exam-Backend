import { Resolver, Query, Mutation, Args, ID, Subscription } from '@nestjs/graphql';
import { ChatService } from './chat.service';
import { ChatMessage } from './models/chat-message.model'; 
import { Chat } from './models/chat.model'; 
import { SendMessageInput } from './dto/send-message.input';
import { CreateChatFriendInput } from './dto/create-chat-friend.input';
import { PubSub } from 'graphql-subscriptions';

const pubSub = new PubSub();

@Resolver(() => ChatMessage)
export class ChatResolver {
  constructor(private readonly chat: ChatService) {}

  // ========= Queries =========
  @Query(() => [ChatMessage])
  messages(@Args('chatId', { type: () => ID }) chatId: string) {
    return this.chat.getMessages(chatId);
  }

  // ========= Mutations =========
  @Mutation(() => ChatMessage)
  async sendMessage(@Args('input') input: SendMessageInput) {
    const saved = await this.chat.sendMessage(input);
    // broadcast (ChatGateway re-emite por socket)
    await pubSub.publish(`messageAdded:${saved.chatId}`, { messageAdded: saved });
    return saved;
  }

  @Mutation(() => ChatMessage)
  async markMessageRead(
    @Args('chatId', { type: () => ID }) chatId: string,
    @Args('messageId', { type: () => ID }) messageId: string,
  ) {
    const updated = await this.chat.markRead(chatId, messageId);
    await pubSub.publish(`messageUpdated:${chatId}`, { messageUpdated: updated });
    return updated;
  }

  // ========= Subscriptions (opcionales) =========
  @Subscription(() => ChatMessage, {
    filter: (payload, variables) => payload.messageAdded.chatId === variables.chatId,
    resolve: (payload) => payload.messageAdded,
  })
  messageAdded(@Args('chatId', { type: () => ID }) chatId: string) {
    return pubSub.asyncIterator(`messageAdded:${chatId}`);
  }

  @Subscription(() => ChatMessage, {
    filter: (payload, variables) => payload.messageUpdated.chatId === variables.chatId,
    resolve: (payload) => payload.messageUpdated,
  })
  messageUpdated(@Args('chatId', { type: () => ID }) chatId: string) {
    return pubSub.asyncIterator(`messageUpdated:${chatId}`);
  }
}