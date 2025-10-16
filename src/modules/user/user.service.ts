import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserInput } from './create-user.input';
import type { User } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // Create new user
  async create(data: CreateUserInput): Promise<Omit<User, 'password'>> {
    if (!data.password || data.password.trim() === '') {
      throw new BadRequestException('Password is required');
    }

    // 1. Prepare data (hash password)
    const { password, ...userData } = data; // Destructure password and keep other data
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      // 2. Nickname Generation Logic (Unchanged)
      const lastGuest = await this.prisma.user.findFirst({
        where: { nickname: { startsWith: 'invitado' } },
        orderBy: { createdAt: 'desc' },
      });

      let guestNickname = 'invitado0';
      if (lastGuest?.nickname) {
        const num = parseInt(lastGuest.nickname.replace('invitado', ''), 10);
        guestNickname = `invitado${isNaN(num) ? 0 : num + 1}`;
      }

      guestNickname += `-${Math.floor(Math.random() * 1000)}`;

      // 3. Create User in Database
      const user = await this.prisma.user.create({
        data: {
          // Spread all user data *except* password (which is in userData)
          ...userData,
          password: hashedPassword,

          // Apply nickname logic
          nickname:
            userData.nickname && userData.nickname.trim() !== ''
              ? userData.nickname
              : guestNickname,

          // Hardcode the Level ID to 1
          levelId: 1,
        },
      });

      // 4. Return user data without password
      const { password: userPassword, ...userDataResponse } = user;
      return userDataResponse;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email or username already exists');
      }

      const message =
        error instanceof Error ? error.message : 'Internal server error';
      throw new InternalServerErrorException(message);
    }
  }

  // Delete user by id (returns user without password)
  async delete(userId: string): Promise<Omit<User, 'password'>> {
    try {
      const user = await this.prisma.user.delete({
        where: { id: userId },
      });
      const { password, ...userData } = user;
      return userData;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Usuario con id ${userId} no encontrado`);
      }

      const message =
        error instanceof Error ? error.message : 'Internal server error';
      throw new InternalServerErrorException(message);
    }
  }

  // Find all users with selected fields
  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
        nickname: true,
        username: true,
        levelId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Find one user by ID
  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
        nickname: true,
        username: true,
        experience: true,
        coins: true,
        level: true,
        createdAt: true,

        skins: {
          include: {
            skin: true, // brings full Skin info
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con id ${userId} no encontrado`);
    }

    return user;
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        level: true,
      },
    });
  }
}
