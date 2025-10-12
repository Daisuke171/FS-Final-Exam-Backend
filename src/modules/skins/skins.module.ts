import { Module } from '@nestjs/common';
import { SkinsService } from './skins.service';
import { PrismaService } from '../prisma/prisma.service';
import { SkinsResolver } from './skins.resolver';

@Module({
  providers: [SkinsService, SkinsResolver, PrismaService],
})
export class SkinsModule {}
