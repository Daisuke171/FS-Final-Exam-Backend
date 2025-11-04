import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Achievement, UserAchievement } from '@prisma/client';

type AchievementWithProgress = Achievement & {
  userAchievement: UserAchievement | null;
};

interface AchievementUnlockResult {
  achievement: Achievement;
  userAchievement: UserAchievement;
}

@Injectable()
export class AchievementsService {
  constructor(private readonly prisma: PrismaService) {}

  // Obtener solo los logros DESBLOQUEADOS del usuario

  async getUserAchievements(
    userId: string,
  ): Promise<AchievementWithProgress[]> {
    // Solo obtener logros que el usuario ha desbloqueado
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: {
        userId,
        unlockedAt: { not: null }, //  Solo desbloqueados
        achievement: { active: true },
      },
      include: {
        achievement: true,
      },
      orderBy: {
        unlockedAt: 'desc', // Más recientes primero
      },
    });

    return userAchievements
      .filter((ua) => ua.achievement !== null)
      .map((ua) => ({
        ...ua.achievement,
        userAchievement: {
          id: ua.id,
          userId: ua.userId,
          achievementId: ua.achievementId,
          currentProgress: ua.currentProgress,
          unlockedAt: ua.unlockedAt,
          seen: ua.seen,
          createdAt: ua.createdAt,
          updatedAt: ua.updatedAt,
        },
      }));
  }

  // Actualizar progreso de logros basado en una acción del usuario

  async updateProgress(
    userId: string,
    eventType: string,
    currentValue: number,
  ): Promise<AchievementUnlockResult[]> {
    // Buscar logros relevantes que el usuario no ha desbloqueado
    const relevantAchievements = await this.prisma.achievement.findMany({
      where: {
        active: true,
        targetType: eventType,
        users: {
          none: {
            userId,
            unlockedAt: { not: null },
          },
        },
      },
      include: {
        users: {
          where: { userId },
        },
      },
    });

    const unlockedAchievements: AchievementUnlockResult[] = [];

    for (const achievement of relevantAchievements) {
      let userAchievement = achievement.users[0];

      // Si no existe progreso, crearlo
      if (!userAchievement) {
        userAchievement = await this.prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            currentProgress: 0,
          },
        });
      }

      // Si ya está desbloqueado, skip
      if (userAchievement.unlockedAt) continue;

      // Actualizar progreso
      const newProgress = Math.min(currentValue, achievement.targetValue);
      const isUnlocked = newProgress >= achievement.targetValue;

      const updated = await this.prisma.userAchievement.update({
        where: { id: userAchievement.id },
        data: {
          currentProgress: newProgress,
          unlockedAt: isUnlocked ? new Date() : undefined,
        },
      });

      // Si se desbloqueó, agregarlo a resultados
      if (isUnlocked) {
        unlockedAchievements.push({
          achievement,
          userAchievement: updated,
        });

        console.log(
          `🏆 Logro desbloqueado: "${achievement.title}" por usuario ${userId}`,
        );
      }
    }

    return unlockedAchievements;
  }

  // Verificar y desbloquear logros después de guardar una partida

  async checkAchievementsAfterGame(userId: string, gameId?: string) {
    const unlocked: AchievementUnlockResult[] = [];

    // 1. Total de partidas jugadas
    const totalGames = await this.prisma.gameHistory.count({
      where: { userId, ...(gameId && { gameId }) },
    });

    const gamesUnlocked = await this.updateProgress(
      userId,
      'total_games',
      totalGames,
    );
    unlocked.push(...gamesUnlocked);

    // 2. Total de victorias
    const totalWins = await this.prisma.gameHistory.count({
      where: { userId, state: 'won', ...(gameId && { gameId }) },
    });

    const winsUnlocked = await this.updateProgress(
      userId,
      'total_wins',
      totalWins,
    );
    unlocked.push(...winsUnlocked);

    // 3. Racha actual
    const currentStreak = await this.getCurrentWinStreak(userId, gameId);
    const streakUnlocked = await this.updateProgress(
      userId,
      'win_streak',
      currentStreak,
    );
    unlocked.push(...streakUnlocked);

    // 4. Score total
    const totalScore = await this.prisma.gameHistory.aggregate({
      where: { userId, ...(gameId && { gameId }) },
      _sum: { score: true },
    });

    const scoreUnlocked = await this.updateProgress(
      userId,
      'total_score',
      totalScore._sum.score || 0,
    );
    unlocked.push(...scoreUnlocked);

    // 5. Victorias perfectas (sin daño)
    const perfectWins = await this.prisma.gameHistory.count({
      where: {
        userId,
        state: 'won',
        totalDamage: 0,
        ...(gameId && { gameId }),
      },
    });

    const perfectUnlocked = await this.updateProgress(
      userId,
      'perfect_wins',
      perfectWins,
    );
    unlocked.push(...perfectUnlocked);

    return unlocked;
  }

  // Marcar logros como vistos

  markAsSeen(userId: string, achievementIds: string[]) {
    return this.prisma.userAchievement.updateMany({
      where: {
        userId,
        achievementId: { in: achievementIds },
      },
      data: {
        seen: true,
      },
    });
  }

  // Obtener logros no vistos (para notificaciones)

  getUnseenAchievements(userId: string) {
    return this.prisma.userAchievement.findMany({
      where: {
        userId,
        unlockedAt: { not: null },
        seen: false,
      },
      include: {
        achievement: true,
      },
      orderBy: {
        unlockedAt: 'desc',
      },
    });
  }

  // Obtener stats de achievements

  async getAchievementStats(userId: string) {
    const totalAchievements = await this.prisma.achievement.count({
      where: { active: true },
    });

    const unlockedAchievements = await this.prisma.userAchievement.count({
      where: {
        userId,
        unlockedAt: { not: null },
      },
    });

    const percentage =
      totalAchievements > 0
        ? Math.round((unlockedAchievements / totalAchievements) * 100)
        : 0;

    return {
      total: totalAchievements,
      unlocked: unlockedAchievements,
      locked: totalAchievements - unlockedAchievements,
      percentage,
    };
  }

  // Helper: Calcular racha actual
  private async getCurrentWinStreak(
    userId: string,
    gameId?: string,
  ): Promise<number> {
    const games = await this.prisma.gameHistory.findMany({
      where: {
        userId,
        ...(gameId && { gameId }),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    let streak = 0;
    for (const game of games) {
      if (game.state === 'won') {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // ADMIN: Crear logro
  createAchievement(data: any): Promise<Achievement> {
    return this.prisma.achievement.create({
      data,
    });
  }

  // ADMIN: Actualizar logro
  updateAchievement(id: string, data: any): Promise<Achievement> {
    return this.prisma.achievement.update({
      where: { id },
      data,
    });
  }

  // ADMIN: Eliminar logro
  deleteAchievement(id: string): Promise<Achievement> {
    return this.prisma.achievement.delete({
      where: { id },
    });
  }
}
