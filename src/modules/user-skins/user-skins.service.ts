import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserSkinInput } from './create-user-skin.input';
import { UserSkin as PrismaUserSkin } from '@prisma/client';

@Injectable()
export class UserSkinService {
  constructor(private readonly prisma: PrismaService) {}

  async assignSkin(data: CreateUserSkinInput) {
    return this.prisma.userSkin.create({ data });
  }

  async assignSkinToUser(
    userId: string,
    skinId: string,
  ): Promise<PrismaUserSkin> {
    return await this.prisma.userSkin.create({
      data: { userId, skinId },
    });
  }

  async findAll() {
    return this.prisma.userSkin.findMany({
      include: { user: true, skin: true },
    });
  }

  async setActive(
    userSkinId: string,
    active: boolean,
  ): Promise<PrismaUserSkin> {
    return this.prisma.userSkin.update({
      where: { id: userSkinId },
      data: { active },
    });
  }

  async findByUser(userId: string): Promise<PrismaUserSkin[]> {
    return this.prisma.userSkin.findMany({
      where: { userId },
      include: { skin: true },
    });
  }

  async findBySkin(skinId: string): Promise<PrismaUserSkin[]> {
    return this.prisma.userSkin.findMany({
      where: { skinId },
      include: { user: true },
    });
  }
}
