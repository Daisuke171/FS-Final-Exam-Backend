import { Module } from '@nestjs/common';
import { GamesResolver } from './games.resolver';
import { GamesService } from './games.service';
import { PrismaService } from 'prisma/prisma.service';
import { GameFavoriteResolver } from './game-favorite.resolver';

@Module({
  providers: [GamesResolver, GamesService, PrismaService, GameFavoriteResolver],
  exports: [GamesService],
})
export class GamesModule {}
