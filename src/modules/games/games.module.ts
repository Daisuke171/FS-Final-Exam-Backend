import { Module } from '@nestjs/common';
import { GamesResolver } from './games.resolver';
import { GamesService } from './games.service';
import { PrismaService } from 'prisma/prisma.service';
import { GameFavoriteResolver } from './game-favorite.resolver';
import { MissionsModule } from '@modules/missions/missions.module';
import { GameCacheService } from './game-cache.service';

@Module({
  providers: [
    GamesResolver,
    GamesService,
    PrismaService,
    GameFavoriteResolver,
    GameCacheService,
  ],
  exports: [GamesService, GameCacheService],
  imports: [MissionsModule],
})
export class GamesModule {}
