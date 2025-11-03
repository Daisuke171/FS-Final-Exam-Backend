import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class GameCacheService implements OnModuleInit {
  private gameIdCache: Map<string, string> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.preloadGames();
  }

  private async preloadGames() {
    try {
      const games = await this.prisma.game.findMany({
        select: {
          id: true,
          name: true,
        },
      });

      games.forEach((game) => {
        this.gameIdCache.set(game.name, game.id);
      });
    } catch (error) {
      console.error('❌ Error pre-cargando juegos:', error);
    }
  }

  async getGameIdByName(gameName: string): Promise<string> {
    // 1. Intentar obtener del cache
    const cachedId = this.gameIdCache.get(gameName);
    if (cachedId) {
      return cachedId;
    }

    // 2. Si no está en cache, buscar en BD
    const game = await this.prisma.game.findUnique({
      where: { name: gameName },
      select: { id: true },
    });

    if (!game) {
      throw new NotFoundException(`Game "${gameName}" not found`);
    }

    // 3. Guardar en cache para próximas consultas
    this.gameIdCache.set(gameName, game.id);

    return game.id;
  }

  async invalidateCache() {
    this.gameIdCache.clear();
    await this.preloadGames();
    console.log('🔄 Cache de juegos invalidado y recargado');
  }

  getCachedGameNames(): string[] {
    return Array.from(this.gameIdCache.keys());
  }

  hasGame(gameName: string): boolean {
    return this.gameIdCache.has(gameName);
  }
}
