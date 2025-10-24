import {
  ConflictException,
  HttpException,
  Inject,
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
import { getEnvNumber } from '@common/utils/env.util';
import { sanitizeAuthResponse } from '@common/utils/sanitize.util';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    @Inject('JWT_REFRESH_SERVICE')
    private readonly refreshJwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async register(data: RegisterInput) {
    const email = data.email.toLowerCase().trim();
    const username = data.username.toLowerCase().trim();
    const nickname = data.nickname.trim();

    try {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }, { nickname }],
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

      const initialLevel = await this.prisma.level.findFirst({
        where: { experienceRequired: 0 },
      });

      if (!initialLevel) {
        throw new InternalServerErrorException('Initial level not found');
      }

      const saltRounds = getEnvNumber('BCRYPT_SALT_ROUNDS');
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);

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

      return sanitizeAuthResponse(user);
    } catch (error: any) {
      console.error('Register error:', error);
      if (error.code === 'P2002') {
        throw new ConflictException('User already exists');
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('No se pudo registrar el usuario');
    }
  }

  async login(loginInput: LoginInput): Promise<AuthResponse> {
    const { usernameOrEmail, password } = loginInput;

    const genericError = new UnauthorizedException(
      'Usuario o contraseña incorrectos',
    );

    try {
      const identifier = usernameOrEmail.toLowerCase().trim();
      const user = await this.userService.findByEmailOrUsername(identifier);

      if (!user) {
        throw genericError;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw genericError;
      }

      const { password: _password, ...safeUser } = user;
      void _password;

      const accessToken = this.jwtService.sign({ sub: user.id });
      const refreshToken = this.refreshJwtService.sign({ sub: user.id });

      console.log('Login exitoso para el usuario:', user.skins);

      return {
        accessToken,
        refreshToken,
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
      console.error('Login error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw genericError;
    }
  }
}
