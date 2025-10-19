import {
  ConflictException,
  Injectable,
  // InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterInput } from './inputs/register.input';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'prisma/prisma.service';
import { User as PrismaUser, Level } from '@prisma/client';

type UserWithLevel = PrismaUser & { level: Level };

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: RegisterInput) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username },
          { nickname: data.nickname },
        ],
      },
      include: {
        level: true,
      },
    });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }
    let initialLevel = await this.prisma.level.findFirst({
      where: { experienceRequired: 0 },
      select: { id: true },
    });

    // Se usó solo para testear, luego se quitará

    if (!initialLevel) {
      initialLevel = await this.prisma.level.create({
        data: {
          experienceRequired: 0,
          name: 'Principiante',
          atomicNumber: 0,
          color: '#000000',
          chemicalSymbol: 'Ni',
        },
      });
    }

    // if (!initialLevel) {
    //   throw new InternalServerErrorException('Initial level not found');
    // }
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...data,
        birthday: new Date(data.birthday),
        password: hashedPassword,
        levelId: initialLevel.id,
      },
      include: {
        level: true,
      },
    });
    return {
      ...user,
      password: undefined,
      skins: [],
      friends: [],
      gameHistory: [],
      gameFavorites: [],
      notifications: [],
      chats: [],
    };
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const payload = {
      username: user.username,
      sub: user.id,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        ...user,
        password: undefined,
        skins: [],
        friends: [],
        gameHistory: [],
        gameFavorites: [],
        notifications: [],
        chats: [],
      },
    };
  }

  async validateUser(email: string, password: string): Promise<UserWithLevel> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        level: true,
      },
    });

    const genericError = new UnauthorizedException('Credenciales inválidas');

    if (!user) {
      throw genericError;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw genericError;
    }

    return user;
  }

  // private excludePassword(user: PrismaUser): Omit<PrismaUser, 'password'> {
  //   const { password, ...result } = user;
  //   return result; // Devuelve el objeto con todos los demás campos
  // }
}
