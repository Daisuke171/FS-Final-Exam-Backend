import { Injectable, NotFoundException  } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ObservableService } from '../../common/observable.service';
import { SendMessageInput } from './dto/send-message.input';

/* import { ChatMessage } from '../models/chat-message.model';
import { Chat } from '../models/chat.model';
import  ChatMessageClass  from './types/chat-message'; */

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly observable: ObservableService,
  ) {}


  // create un chat entre dos usuarios (si no existe)
  async createChat(userId: string, friendId: string) {
    // valida que existan ambos usuarios
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('No existe el usuario');

    const friend = await this.prisma.user.findUnique({
      where: { id: friendId },
      select: { id: true },
    });
    if (!friend) throw new NotFoundException('No existe el amigo');

    const chat = await this.prisma.chat.create({
      data: {
        userId,
        friendId,
      },
    });

    return chat;
  }

    async sendMessage(input: SendMessageInput) {
    // valida que exista el chat
    const chat = await this.prisma.chat.findUnique({
      where: { id: input.chatId },
      select: { id: true },
    });
    if (!chat) throw new NotFoundException('Chat not found');

    const newMsg = await this.prisma.chatMessage.create({
      data: {
        chatId: input.chatId,
        senderId: input.senderId,
        message: input.message,
        status: 'sended',
      },
    });

    // dispara evento para gateways
    this.observable.notify({
      type: 'chatMessage',
      data: newMsg,
    });

/*     this.observable.notify({
      type: 'notification',
      data: { type: 'chatMessage', entity: input.chatId, msgId: msg.id },
    }); */
    return newMsg;
  }
 
  async getMessages(chatId: string) {
    return this.prisma.chatMessage.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markRead(chatId: string, messageId: string) {
    const updated = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { read: true, status: 'read' },
    });
    return updated;
  }
}
