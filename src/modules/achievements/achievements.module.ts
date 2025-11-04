import { Module } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { AchievementsResolver } from './achievements.resolver';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  providers: [AchievementsResolver, AchievementsService, PrismaService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
