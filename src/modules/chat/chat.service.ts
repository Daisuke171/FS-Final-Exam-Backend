import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ObservableService } from '@common/observable.service';
import { SendMessageInput } from './dto/send-message.input';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly observable: ObservableService,
  ) {}

  async sendMessage(input: SendMessageInput) {

    const newMsg = await this.prisma.chatMessage.create({
      data: {
        chatId: input.chatId,
        senderId: input.senderId,
        message: input.message,
        status: 'sent', 
      },
    });

    this.observable.notify({ type: 'chatMessage', data: newMsg });

    return newMsg;
  }

  async getMessages(chatId: string) {
    const exists = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Chat not found');

    return this.prisma.chatMessage.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markRead(chatId: string, messageId: string) {
    // validar pertenencia mensaje ↔ chat
    const msg = await this.prisma.chatMessage.findFirst({
      where: { id: messageId, chatId },
    });
    if (!msg) throw new NotFoundException('Message not found in chat');

    const updated = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { read: true, status: 'read' },
    });

    this.observable.notify({ type: 'chatMessageUpdated', data: updated });
    return updated;
  }

  async markAllRead(chatId: string, userId: string) {
  const updated = await this.prisma.chatMessage.updateMany({
    where: {
      chatId,
      senderId: { not: userId },
      read: false,
    },
    data: { read: true, status: 'read' },
  });

  this.observable.notify({ 
    type: 'chatMessagesRead', 
    data: { chatId, count: updated.count } 
  });
  
  return updated;
}
}
