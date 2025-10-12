import { Module } from '@nestjs/common';
import { UserSkinService } from './user-skins.service';
import { UserSkinResolver } from './user-skins.resolver';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [UserSkinResolver, UserSkinService, PrismaService],
  exports: [UserSkinService],
})
export class UserSkinModule {}
