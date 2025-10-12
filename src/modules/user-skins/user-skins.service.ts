import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserSkinInput } from './create-user-skin.input';

@Injectable()
export class UserSkinService {
  constructor(private readonly prisma: PrismaService) {}

  async assignSkin(data: CreateUserSkinInput) {
    return this.prisma.userSkins.create({ data });
  }

  async findAll() {
    return this.prisma.userSkins.findMany({
      include: { user: true, skin: true },
    });
  }
}
