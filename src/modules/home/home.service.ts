import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; 
import { DashboardOutput } from './dto/dashboard.output';

@Injectable()
export class HomeService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData(userId: string): Promise<DashboardOutput> {
    // 1. Juegos/Misiones Disponibles
    const games = await this.prisma.game.findMany({
      select: { id: true, name: true, gameLogo: true },
      orderBy: { name: 'asc' }, 
      take: 5, 
    });

    // 2. Conteo de Notificaciones NO leídas
    const unreadNotificationsCount = await this.prisma.notification.count({
      where: { 
        userId, 
        isRead: false
      },
    });

    // 3. Conteo de Mensajes NO leídos
    const unreadMessagesCount = await this.prisma.chatMessage.count({
      where: {
        read: false,
        senderId: { not: userId },
        chat: { 
            OR: [{ userId: userId }, { friend: { requesterId: userId } }, { friend: { receiverId: userId } }]
        }
      },
    });

    return {
      games,
      notifications: { unreadCount: unreadNotificationsCount },
      messages: { unreadCount: unreadMessagesCount },
    } as DashboardOutput;
  }
}