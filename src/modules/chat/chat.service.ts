import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ObservableService } from '@common/observable.service';
import { SendMessageInput } from './dto/send-message.input';

type ChatStatus = 'sent' | 'read';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly observable: ObservableService,
  ) {}

  async sendMessage(input: SendMessageInput) {
    // 1) validar chat
    const chat = await this.prisma.chat.findUnique({
      where: { id: input.chatId },
      select: { id: true },
    });
    if (!chat) throw new NotFoundException('Chat not found');

    // 2) crear mensaje
    const newMsg = await this.prisma.chatMessage.create({
      data: {
        chatId: input.chatId,
        senderId: input.senderId,
        message: input.message,
        status: 'sent', // estandar
      },
    });

    // 3) notificar al bus (lo reenviará el Gateway)
    this.observable.notify({ type: 'chatMessage', data: newMsg });

    return newMsg;
  }

  async getMessages(chatId: string) {
    // opcional: validar que exista el chat
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
}
