// src/modules/game-favorite/game-favorite.module.ts
import { Module } from '@nestjs/common';
import { GameFavoriteResolver } from './game-favorite.resolver';
import { GameFavoriteService } from './game-favorite.service';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GameFavoriteResolver, GameFavoriteService],
  exports: [GameFavoriteService],
})
export class GameFavoriteModule {}
