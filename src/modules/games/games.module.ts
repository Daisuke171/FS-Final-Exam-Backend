import { Module } from '@nestjs/common';
import { GamesResolver } from './games.resolver';
import { GamesService } from './games.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  providers: [GamesResolver, GamesService, PrismaService],
  exports: [GamesService],
})
export class GamesModule {}
