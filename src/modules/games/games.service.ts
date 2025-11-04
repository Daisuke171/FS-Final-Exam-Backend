import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateGameInput } from './inputs/create-game.input';
import { UpdateGameInput } from './inputs/update-game.input';
import { SaveGameResultInput } from './inputs/save-game.input';
import { MissionsService } from '@modules/missions/missions.service';
import { GameCacheService } from './game-cache.service';
import { AchievementsService } from '@modules/achievements/achievements.service';

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly missionsService: MissionsService,
    private readonly gameCache: GameCacheService,
    private readonly achievementsService: AchievementsService,
  ) {}

  // CRUD de juegos

  async findAll() {
    return this.prisma.game.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }
    return game;
  }

  async findByName(name: string) {
    const game = await this.prisma.game.findFirst({ where: { name } });
    if (!game) {
      throw new NotFoundException(`Game with name ${name} not found`);
    }
    return game;
  }

  async createGame(input: CreateGameInput) {
    const game = await this.prisma.game.create({
      data: input,
    });
    await this.gameCache.invalidateCache();

    return game;
  }

  async deleteGame(id: string) {
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }
    await this.gameCache.invalidateCache();

    return this.prisma.game.delete({ where: { id } });
  }

  async updateGame(id: string, input: UpdateGameInput) {
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }
    return this.prisma.game.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        rules: input.rules,
        gameLogo: input.gameLogo,
        category: input.category,
        score: input.score,
        duration: input.duration,
        maxPlayers: input.maxPlayers,
        minPlayers: input.minPlayers,
      },
    });
  }

  // Historial

  async saveGameResult(input: SaveGameResultInput, userId: string) {
    const gameId = await this.gameCache.getGameIdByName(input.gameName);
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });
    if (!game) {
      throw new NotFoundException(`Game with ID ${gameId} not found`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    const currentScore = await this.prisma.gameHistory.aggregate({
      where: { userId },
      _sum: { score: true },
    });

    const userTotalScore = currentScore._sum.score || 0;

    // 2. Calcular el nuevo total
    let scoreToSave = input.score;
    const newTotal = userTotalScore + input.score;

    // 3. Si el nuevo total sería negativo, ajustar
    if (newTotal < 0) {
      // Solo restar hasta dejar en 0
      scoreToSave = -userTotalScore;
      console.log(
        `⚠️ Score ajustado: ${input.score} → ${scoreToSave} (para evitar total negativo)`,
      );
    }

    const gameHistory = await this.prisma.gameHistory.create({
      data: {
        gameId,
        userId,
        duration: input.duration,
        state: input.state,
        score: scoreToSave,
        totalDamage: input.totalDamage,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            lastname: true,
          },
        },
        game: true,
      },
    });

    await this.missionsService.updateProgress(userId, 'game_played', {
      gameId,
    });

    const unlockedAchievements =
      await this.achievementsService.checkAchievementsAfterGame(userId, gameId);

    if (unlockedAchievements.length > 0) {
      console.log(
        `🎉 ${unlockedAchievements.length} logro(s) desbloqueado(s):`,
      );
      unlockedAchievements.forEach(({ achievement }) => {
        console.log(`   🏆 ${achievement.title} (${achievement.rarity})`);
      });
    }

    // 2. Si ganó
    if (input.state === 'won') {
      await this.missionsService.updateProgress(userId, 'game_won', {
        gameId,
      });

      // 3. Victoria perfecta (sin daño)
      if (!input.totalDamage || input.totalDamage === 0) {
        await this.missionsService.updateProgress(userId, 'perfect_win', {
          gameId,
          damageTaken: 0,
        });
      }

      // 4. Calcular racha actual
      const streak = await this.calculateCurrentStreak(userId, gameId);
      await this.missionsService.updateProgress(userId, 'win_streak', {
        gameId,
        currentStreak: streak,
      });
    }

    // 5. Score total
    await this.missionsService.updateProgress(userId, 'total_score', {
      gameId,
      score: scoreToSave,
    });

    // 6. Verificar si jugó ambos juegos
    await this.missionsService.updateProgress(userId, 'play_both_games', {
      gameId,
    });

    return gameHistory;
  }

  private async calculateCurrentStreak(userId: string, gameId?: string) {
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

  async getUserGameHistory(userId: string, gameId?: string) {
    return this.prisma.gameHistory.findMany({
      where: {
        userId,
        ...(gameId && { gameId }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        game: true,
      },
      take: 10,
    });
  }

  async getLastGamePlayed(userId: string, gameId: string) {
    return this.prisma.gameHistory.findFirst({
      where: {
        userId,
        gameId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        createdAt: true,
      },
    });
  }

  // Leaderboard

  async getLeaderboard(gameId: string, limit: number = 50) {
    const game = await this.findOne(gameId);
    if (!game) {
      throw new NotFoundException(`Game with ID ${gameId} not found`);
    }
    const userStats = await this.prisma.gameHistory.groupBy({
      by: ['userId'],
      where: {
        gameId,
      },
      _sum: {
        score: true,
      },
      orderBy: {
        _sum: {
          score: 'desc',
        },
      },
      _max: {
        score: true,
      },
      _count: {
        id: true,
      },
      take: limit,
    });
    const entries = await Promise.all(
      userStats.map(async (stat, index) => {
        const user = await this.prisma.user.findUnique({
          where: { id: stat.userId },
          select: {
            id: true,
            nickname: true,
            name: true,
            lastname: true,
            level: {
              select: {
                atomicNumber: true,
              },
            },
            skins: {
              where: { active: true },
              take: 1,
              select: {
                skin: {
                  select: {
                    id: true,
                    name: true,
                    img: true,
                  },
                },
              },
            },
          },
        });
        const wins = await this.prisma.gameHistory.count({
          where: {
            userId: stat.userId,
            state: 'won',
          },
        });

        return {
          rank: index + 1,
          userId: stat.userId,
          nickname: user?.nickname,
          name: user ? `${user.name} ${user.lastname}` : null,
          totalScore: stat._sum.score,
          bestScore: stat._max.score,
          wins,
          skin: user?.skins[0]?.skin,
          level: user?.level.atomicNumber,
          totalGames: stat._count.id,
        };
      }),
    );
    return {
      gameId,
      gameName: game.name,
      entries,
      generatedAt: new Date(),
    };
  }

  async getGlobalLeaderboard(limit: number = 50) {
    const userStats = await this.prisma.gameHistory.groupBy({
      by: ['userId'],
      _sum: {
        score: true,
      },
      orderBy: {
        _sum: {
          score: 'desc',
        },
      },
      _max: {
        score: true,
      },
      _count: {
        id: true,
      },
      take: limit,
    });

    const entries = await Promise.all(
      userStats.map(async (stat, index) => {
        const user = await this.prisma.user.findUnique({
          where: { id: stat.userId },
          select: {
            id: true,
            nickname: true,
            name: true,
            lastname: true,
            level: {
              select: {
                atomicNumber: true,
              },
            },
            skins: {
              where: { active: true },
              take: 1,
              select: {
                skin: {
                  select: {
                    id: true,
                    name: true,
                    img: true,
                  },
                },
              },
            },
          },
        });
        const wins = await this.prisma.gameHistory.count({
          where: {
            userId: stat.userId,
            state: 'won',
          },
        });

        return {
          rank: index + 1,
          userId: stat.userId,
          nickname: user?.nickname,
          name: user ? `${user.name} ${user.lastname}` : null,
          totalScore: stat._sum.score,
          bestScore: stat._max.score,
          wins,
          skin: user?.skins[0]?.skin,
          level: user?.level.atomicNumber,
          totalGames: stat._count.id,
        };
      }),
    );

    return {
      gameId: '',
      gameName: 'Global',
      entries,
      generatedAt: new Date(),
    };
  }

  async getUserStats(userId: string, gameId?: string) {
    // Verificar que el usuario existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Filtro base
    const whereClause: any = { userId };
    if (gameId) {
      whereClause.gameId = gameId;
    }

    // Obtener todos los juegos del usuario
    const games = await this.prisma.gameHistory.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    if (games.length === 0) {
      return {
        winRate: 0,
        totalTime: '0h 0m',
        highScore: 0,
        bestStreak: 0,
        avgPerDay: 0,
        totalGames: 0,
        totalWins: 0,
        totalLosses: 0,
        totalDraws: 0,
        averageScore: 0,
        totalDamage: 0,
      };
    }

    // Calcular estadísticas
    const totalGames = games.length;
    const totalWins = games.filter((g) => g.state === 'won').length;
    const totalLosses = games.filter((g) => g.state === 'lost').length;
    const totalDraws = games.filter((g) => g.state === 'draw').length;
    const winRate = (totalWins / totalGames) * 100;

    const totalSeconds = games.reduce((sum, g) => sum + g.duration, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let totalTime = '';
    if (hours > 0) {
      totalTime = `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      totalTime = `${minutes}m ${seconds}s`;
    } else {
      totalTime = `${seconds}s`;
    }
    // Mejor puntuación
    const highScore = Math.max(...games.map((g) => g.score));

    // Mejor racha
    let currentStreak = 0;
    let bestStreak = 0;
    games.forEach((game) => {
      if (game.state === 'won') {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    // Promedio de partidas por día
    const firstGameDate = new Date(games[games.length - 1].createdAt);
    const lastGameDate = new Date(games[0].createdAt);
    const daysDiff = Math.ceil(
      (lastGameDate.getTime() - firstGameDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const avgPerDay =
      daysDiff > 0
        ? parseFloat((totalGames / daysDiff).toFixed(1))
        : totalGames;

    // Promedio de score
    const averageScore = Math.round(
      games.reduce((sum, g) => sum + g.score, 0) / totalGames,
    );

    return {
      winRate: parseFloat(winRate.toFixed(1)),
      totalTime,
      highScore,
      bestStreak,
      avgPerDay,
      totalGames,
      totalWins,
      totalLosses,
      totalDraws,
      averageScore,
    };
  }

  // Favoritos

  async toggleFavorite(userId, gameId) {
    const existing = await this.prisma.gameFavorite.findFirst({
      where: {
        userId,
        gameId,
      },
    });

    if (existing) {
      await this.prisma.gameFavorite.delete({
        where: { id: existing.id },
      });
      return false;
    } else {
      await this.prisma.gameFavorite.create({
        data: {
          userId,
          gameId,
        },
      });
      return true;
    }
  }

  async getUserFavorites(userId: string) {
    return this.prisma.gameFavorite.findMany({
      where: { userId },
      include: {
        game: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
