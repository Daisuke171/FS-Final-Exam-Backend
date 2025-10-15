import { Module } from '@nestjs/common';
import { LevelService } from './level.service';
import { LevelResolver } from './level.resolver';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [LevelService, LevelResolver, PrismaService],
})
export class LevelModule {}
