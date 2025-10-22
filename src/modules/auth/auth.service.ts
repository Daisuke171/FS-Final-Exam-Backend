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
    const email = data.email.toLowerCase().trim();
    const username = data.username.toLowerCase().trim();
    const nickname = data.nickname.trim();

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username },
          { nickname: data.nickname },
        ],
      },
      select: { email: true, username: true, nickname: true },
    });

    if (existingUser) {
      const conflicts = {
        email: 'El Email ya existe',
        username: 'El Username ya existe',
        nickname: 'El Nickname ya existe',
      };

      for (const key of Object.keys(conflicts)) {
        if (existingUser[key] === (data as any)[key]) {
          throw new ConflictException(conflicts[key]);
        }
      }
    }

    let initialLevel = await this.prisma.level.findFirst({
      where: { experienceRequired: 0 },
    });

    if (!initialLevel) {
      throw new InternalServerErrorException('Initial level not found');
    }

    const hashedPassword = await bcrypt.hash(
      data.password,
      Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
    );

    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        nickname,
        name: data.name.trim(),
        lastname: data.lastname.trim(),
        birthday: new Date(data.birthday),
        password: hashedPassword,
        levelId: initialLevel.id,
      },
      include: {
        level: true,
      },
    });

    const { password, ...safeUser } = user;
    return {
      ...safeUser,
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