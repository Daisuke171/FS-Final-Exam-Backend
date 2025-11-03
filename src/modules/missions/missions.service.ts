import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { MissionType } from '@prisma/client';
import {
  MissionProgressUpdate,
  MissionEventData,
  WinStreakEvent,
  PerfectWinEvent,
  TotalScoreEvent,
} from './types/missions.types';
import { CreateMissionInput } from './inputs/create-mission.input';
import { UpdateMissionInput } from './inputs/update-mission.input';
import { UserService } from '@modules/user/user.service';
import { calculateLevelData } from '@modules/games/web-sockets/rock-paper-scissors/utils/level.helper';

@Injectable()
export class MissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  // Obtener todas las misiones activas con progreso del usuario
  async getUserMissions(userId: string) {
    await this.checkAndResetDailyMissions(userId);

    const missions = await this.prisma.mission.findMany({
      where: { active: true },
      include: {
        progress: {
          where: { userId },
        },
      },
      orderBy: [
        { type: 'asc' }, // GENERAL primero, luego DAILY
        { order: 'asc' },
      ],
    });

    return missions.map((mission) => ({
      ...mission,
      userProgress: mission.progress[0] || null,
    }));
  }

  // Verificar y actualizar progreso basado en una acción
  async updateProgress(
    userId: string,
    eventType: string,
    eventData: MissionEventData,
  ) {
    const relevantMissions = await this.prisma.mission.findMany({
      where: {
        active: true,
        targetType: eventType,
        progress: {
          some: {
            userId,
            completed: false,
          },
        },
      },
      include: {
        progress: {
          where: { userId },
        },
      },
    });

    const updates: MissionProgressUpdate[] = [];

    for (const mission of relevantMissions) {
      const progress = mission.progress[0];
      if (!progress || progress.completed) continue;

      // Verificar si el evento aplica a esta misión
      if (mission.gameId && mission.gameId !== eventData.gameId) {
        continue;
      }

      let increment = 0;

      switch (eventType) {
        case 'game_played':
          increment = 1;
          break;

        case 'game_won':
          increment = 1;
          break;

        case 'win_streak': {
          // Para rachas, actualizamos al valor actual si es mayor
          const streakData = eventData as WinStreakEvent;
          increment = Math.max(
            0,
            streakData.currentStreak - progress.currentProgress,
          );
          break;
        }

        case 'perfect_win': {
          // Victoria sin recibir daño
          const perfectData = eventData as PerfectWinEvent;
          if (perfectData.damageTaken === 0) {
            increment = 1;
          }
          break;
        }

        case 'total_score': {
          const scoreData = eventData as TotalScoreEvent;
          increment = scoreData.score;
          break;
        }

        case 'play_both_games': {
          // Verificar si jugó ambos juegos hoy
          const gamesPlayedToday = await this.getGamesPlayedToday(userId);
          if (gamesPlayedToday.length >= 2) {
            increment = 1;
          }
          break;
        }
      }

      if (increment > 0) {
        const newProgress = progress.currentProgress + increment;
        const isCompleted = newProgress >= mission.targetValue;

        const updated = await this.prisma.userMissionProgress.update({
          where: { id: progress.id },
          data: {
            currentProgress: Math.min(newProgress, mission.targetValue),
            completed: isCompleted,
            completedAt: isCompleted ? new Date() : undefined,
          },
        });

        updates.push({ mission, progress: updated });
      }
    }

    return updates;
  }

  // Reclamar recompensa de una misión completada
  async claimReward(userId: string, missionId: string) {
    const progress = await this.prisma.userMissionProgress.findFirst({
      where: {
        userId,
        missionId,
        completed: true,
        claimedReward: false,
      },
      include: {
        mission: true,
      },
    });

    if (!progress) {
      throw new NotFoundException('Mission not completed or already claimed');
    }

    const xpGained = progress.mission.xpReward;

    const userBefore = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { level: true },
    });

    if (!userBefore) {
      throw new NotFoundException('User not found');
    }

    const xpResult = await this.userService.addExperience(userId, xpGained);

    const levelData = calculateLevelData(userBefore, xpResult, xpGained);

    const newCoins = userBefore.coins + progress.mission.coinsReward;

    // Actualizar usuario y progreso en transacción
    const [updatedUser, updatedProgress] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          coins: newCoins,
        },
        include: { level: true },
      }),
      this.prisma.userMissionProgress.update({
        where: { id: progress.id },
        data: {
          claimedReward: true,
          claimedAt: new Date(),
        },
        include: {
          mission: true,
        },
      }),
    ]);

    return {
      user: updatedUser,
      progress: updatedProgress,
      rewards: {
        xp: xpGained,
        coins: progress.mission.coinsReward,
      },
      levelData,
    };
  }

  // Crear progreso inicial para un usuario en todas las misiones
  async initializeUserMissions(userId: string) {
    const missions = await this.prisma.mission.findMany({
      where: { active: true },
    });

    const existing = await this.prisma.userMissionProgress.findMany({
      where: { userId },
      select: { missionId: true },
    });

    const existingIds = new Set(existing.map((e) => e.missionId));
    const newMissions = missions.filter((m) => !existingIds.has(m.id));

    if (newMissions.length === 0) {
      return [];
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return this.prisma.userMissionProgress.createMany({
      data: newMissions.map((mission) => ({
        userId,
        missionId: mission.id,
        resetAt: mission.type === MissionType.DAILY ? tomorrow : null,
        lastResetDate: mission.type === MissionType.DAILY ? now : null,
      })),
    });
  }

  // Verificar y resetear misiones diarias
  private async checkAndResetDailyMissions(userId: string) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const dailyProgress = await this.prisma.userMissionProgress.findMany({
      where: {
        userId,
        mission: {
          type: MissionType.DAILY,
        },
        OR: [{ lastResetDate: { lt: now } }, { lastResetDate: null }],
      },
    });

    if (dailyProgress.length === 0) return;

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await this.prisma.userMissionProgress.updateMany({
      where: {
        id: { in: dailyProgress.map((p) => p.id) },
      },
      data: {
        currentProgress: 0,
        completed: false,
        claimedReward: false,
        completedAt: null,
        claimedAt: null,
        lastResetDate: now,
        resetAt: tomorrow,
      },
    });
  }

  // Resetear una misión específica
  private resetMissionProgress(progressId: string) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return this.prisma.userMissionProgress.update({
      where: { id: progressId },
      data: {
        currentProgress: 0,
        completed: false,
        claimedReward: false,
        completedAt: null,
        claimedAt: null,
        lastResetDate: now,
        resetAt: tomorrow,
      },
    });
  }

  // Helper: Obtener juegos únicos jugados hoy
  private async getGamesPlayedToday(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const games = await this.prisma.gameHistory.findMany({
      where: {
        userId,
        createdAt: { gte: today },
      },
      select: {
        gameId: true,
      },
      distinct: ['gameId'],
    });

    return games;
  }

  // ADMIN: Crear una misión
  async createMission(data: CreateMissionInput) {
    const mission = await this.prisma.mission.create({
      data,
    });

    return mission;
  }

  // ADMIN: Actualizar misión
  async updateMission(id: string, data: UpdateMissionInput) {
    const mission = await this.prisma.mission.update({
      where: { id },
      data,
    });

    return mission;
  }

  // ADMIN: Eliminar misión
  async deleteMission(id: string) {
    const mission = await this.prisma.mission.delete({
      where: { id },
    });

    return mission;
  }
}
