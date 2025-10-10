import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserInput } from './create-user.input';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserInput) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const lastGuest = await this.prisma.user.findFirst({
      where: { nickname: { startsWith: 'invitado' } },
      orderBy: { createdAt: 'desc' },
    });

    let guestNickname = 'invitado0';
    if (lastGuest?.nickname) {
      const num = parseInt(lastGuest.nickname.replace('invitado', ''), 10);
      guestNickname = `invitado${num + 1}`;
    }

    const user = await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        nickname:
          data.nickname && data.nickname.trim() !== ''
            ? data.nickname
            : guestNickname,
      },
    });

    const { password, ...userData } = user;
    return userData;
  }

  async delete(userId: string) {
    try {
      return await this.prisma.user.delete({
        where: { id: userId },
      });
    } catch (error) {
      throw new NotFoundException(`Usuario con id ${userId} no encontrado`);
    }
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        username: true,
        createdAt: true,
      },
    });
  }
}
