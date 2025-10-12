import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserSkinInput } from './create-user-skin.input';
import { UserSkins as PrismaUserSkin } from '@prisma/client';

@Injectable()
export class UserSkinService {
  constructor(private readonly prisma: PrismaService) {}

  async assignSkin(data: CreateUserSkinInput) {
    return this.prisma.userSkins.create({ data });
  }

  async assignSkinToUser(
    userId: string,
    skinId: string,
  ): Promise<PrismaUserSkin> {
    return await this.prisma.userSkins.create({
      data: { userId, skinId },
    });
  }

  async findAll() {
    return this.prisma.userSkins.findMany({
      include: { user: true, skin: true },
    });
  }

  async setActive(
    userSkinId: string,
    active: boolean,
  ): Promise<PrismaUserSkin> {
    return this.prisma.userSkins.update({
      where: { id: userSkinId },
      data: { active },
    });
  }

  async findByUser(userId: string): Promise<PrismaUserSkin[]> {
    return this.prisma.userSkins.findMany({
      where: { userId },
      include: { skin: true },
    });
  }

  async findBySkin(skinId: string): Promise<PrismaUserSkin[]> {
    return this.prisma.userSkins.findMany({
      where: { skinId },
      include: { user: true },
    });
  }
}
