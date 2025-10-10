import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ObservableService } from '../../common/observable.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private observable: ObservableService,
  ) {}

  async sendMessage(chatId: string, senderId: string, message: string) {
    const newMsg = await this.prisma.chatMessage.create({
      data: {
        chatId,
        senderId,
        message,
      },
      include: {
        chat: {
          include: {
            user: true,
            friend: { include: { user: true } },
          },
        },
      },
    });
      // Notificar a todos los observadores (gateways, servicios, etc.)
    this.observable.notify({
      type: 'chatMessage',
      data: newMsg,
    });

    return newMsg;
  }

 
  async getMessages(chatId: string) {
    return this.prisma.chatMessage.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
