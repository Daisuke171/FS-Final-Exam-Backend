import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterInput } from './inputs/register.input';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'prisma/prisma.service';
import { UserService } from '../user/user.service';
import { LoginInput } from '../auth/inputs/login.input';
import { AuthResponse } from '../auth/responses/auth.response';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly userService: UserService,
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
    const initialLevel = await this.prisma.level.findFirst({
      where: { experienceRequired: 0 },
      select: { id: true },
    });

    if (!initialLevel) {
      throw new InternalServerErrorException('Initial level not found');
    }
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

  async login(loginInput: LoginInput): Promise<AuthResponse> {
    const { usernameOrEmail, password } = loginInput;

    const genericError = new UnauthorizedException(
      'Usuario o contraseña incorrectos',
    );

    try {
      const user =
        await this.userService.findByEmailOrUsername(usernameOrEmail);

      if (!user) {
        throw genericError;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw genericError;
      }

      const { password: _removed, ...safeUser } = user;
      void _removed;

      const accessToken = this.jwtService.sign({ sub: user.id });

      return {
        accessToken,
        user: {
          ...safeUser,
          friends: [],
          gameHistory: [],
          gameFavorites: [],
          notifications: [],
          chats: [],
        },
      };
    } catch (error) {
      console.error('FATAL INTERNAL ERROR AFTER PASSWORD CHECK:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw genericError;
    }
  }
}
