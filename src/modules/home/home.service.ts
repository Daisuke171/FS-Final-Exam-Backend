// src/modules/home/home.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; 
import { DashboardOutput } from './dto/dashboard.output'
import { GameStatus, ChallengeStatus } from '@prisma/client'; 

@Injectable()
export class HomeService {
  constructor(private prisma: PrismaService) {}

  // --- FUNCIÓN AUXILIAR: GENERACIÓN DE RETOS (Lo que crea el enunciado) ---
  private async generateChallenges(userId: string): Promise<void> {
    const codeWarId = '5adbf4f6-12f2-45cf-84cd-be231af8dfe4'; 

    const activeMissionsCount = await this.prisma.notification.count({
      where: { userId, isRead: false, challengeType: ChallengeStatus.MISSION }, 
    });
    if (activeMissionsCount > 0) return;

    // Lógica para generar la MISIÓN #1 (Reto de High Score)
    const cwHighscore = await this.prisma.gameHistory.findFirst({
        where: { userId, gameId: codeWarId },
        orderBy: { score: 'desc' },
        select: { score: true }
    });

    if (cwHighscore && cwHighscore.score >= 0) {
        const targetScore = Math.floor(cwHighscore.score * 1.1) + 1; 
        
        await this.prisma.notification.create({
            data: {
                userId,
                type: 'MISSION_CREATED',
                challengeType: ChallengeStatus.MISSION,
                entity: `¡Récord! Supera tu marca de ${cwHighscore.score} puntos. Objetivo: ${targetScore} pts.`,
                isRead: false,
            }
        });
    }
  }

  // --- FUNCIÓN PRINCIPAL DE LECTURA ---
  async getDashboardData(userId: string): Promise<DashboardOutput> {
    
    
    try {
        await this.generateChallenges(userId);
    } catch (e) {
        console.error("Error al generar desafíos (BD inalcanzable):", e);
    }


    // 2. Lectura de Juegos y Favoritos
    const gamesRaw = await this.prisma.game.findMany({
      select: { id: true, name: true, gameLogo: true },
      orderBy: { name: 'asc' },
      where: {
        OR: [
          { status: GameStatus.ACTIVE }, 
          { status: GameStatus.UPCOMING }
        ]
      },
    });

    const favoriteGameIds = await this.prisma.gameFavorite.findMany({
        where: { userId },
        select: { gameId: true }
    }).then(favorites => favorites.map(f => f.gameId));

    const gamesWithFavoriteStatus = gamesRaw.map(game => ({
        ...game,
        isFavorite: favoriteGameIds.includes(game.id)
    }));


    // 3. Contadores
    const totalUnreadNotifications = await this.prisma.notification.count({
        where: { userId, isRead: false },
    });

    const unreadMessagesCount = await this.prisma.chatMessage.count({
      where: { read: false, senderId: { not: userId }, chat: { userId: userId } },
    });

    // 4. Retorno Final
    return {
      games: gamesWithFavoriteStatus.slice(0, 5),
      notifications: { unreadCount: totalUnreadNotifications },
      messages: { unreadCount: unreadMessagesCount },
    } as DashboardOutput;
  }
}