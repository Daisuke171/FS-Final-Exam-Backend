// src/modules/game-favorite/game-favorite.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class GameFavoriteService {
  constructor(private prisma: PrismaService) {}

  async toggle({ userId, gameId }: { userId: string; gameId: string }): Promise<boolean> {
    const favorite = await this.prisma.gameFavorite.findUnique({
      where: {
        userId_gameId: { userId, gameId },
      },
    });

    if (favorite) {
      await this.prisma.gameFavorite.delete({ where: { id: favorite.id } });
      return false; // se quitó
    }

    await this.prisma.gameFavorite.create({
      data: { userId, gameId },
    });
    return true; // se agregó
  }
}
