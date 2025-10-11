import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGameInput } from './inputs/create-game.input';
import { UpdateGameInput } from './inputs/update-game.input';
import { SaveGameResultInput } from './inputs/save-game.input';
import { ToggleFavoriteInput } from './inputs/togle-favorite.input';

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

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

  async createGame(input: CreateGameInput) {
    return this.prisma.game.create({
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

  async deleteGame(id: string) {
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }
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

  async saveGameResult(input: SaveGameResultInput) {
    const game = await this.prisma.game.findUnique({
      where: { id: input.gameId },
    });
    if (!game) {
      throw new NotFoundException(`Game with ID ${input.gameId} not found`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${input.userId} not found`);
    }

    return this.prisma.gameHistory.create({
      data: {
        gameId: input.gameId,
        userId: input.userId,
        duration: input.duration,
        state: input.state,
        score: input.score,
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
  }

  async getUserGameHistory(userId: string, gameId: string) {
    return this.prisma.gameHistory.findMany({
      where: {
        userId,
        gameId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        game: true,
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

  // Favoritos

  async toggleFavorite(input: ToggleFavoriteInput) {
    const existing = await this.prisma.gameFavorite.findFirst({
      where: {
        userId: input.userId,
        gameId: input.gameId,
      },
    });

    if (existing) {
      await this.prisma.gameFavorite.delete({
        where: { id: existing.id },
      });
      return { isFavorite: false, message: 'Removed from favorites' };
    } else {
      await this.prisma.gameFavorite.create({
        data: {
          userId: input.userId,
          gameId: input.gameId,
        },
      });
      return { isFavorite: true, message: 'Added to favorites' };
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
