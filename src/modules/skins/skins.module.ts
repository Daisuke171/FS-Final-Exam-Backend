import { Module } from '@nestjs/common';
import { SkinsService } from './skins.service';
import { PrismaService } from '../prisma/prisma.service';
import { SkinResolver } from './skins.resolver';

@Module({
  providers: [SkinsService, SkinResolver, PrismaService],
})
export class SkinsModule {}
