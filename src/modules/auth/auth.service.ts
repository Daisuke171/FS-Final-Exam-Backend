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
      const identifier = usernameOrEmail.trim();
      const user = await this.userService.findByEmailOrUsername(identifier);

      if (!user) {
        console.warn(`Login fallido: no se encontró usuario con ${identifier}`);
        throw genericError;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        console.warn(
          `Login fallido: contraseña incorrecta para usuario ${user.username}`,
        );
        throw genericError;
      }

      const { password: _password, ...safeUser } = user;
      void _password;

      const accessToken = this.jwtService.sign({ sub: user.id });
      const refreshToken = this.refreshJwtService.sign({ sub: user.id });

      await this.prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
        },
      });

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

  async validateRefreshToken(token: string): Promise<string> {
    try {
      // Verificar firma del JWT
      const payload = this.refreshJwtService.verify(token) as { sub: string };

      // Buscar en DB
      const stored = await this.prisma.refreshToken.findUnique({
        where: { token },
      });

      if (!stored || stored.revoked) {
        throw new UnauthorizedException('Refresh token inválido o revocado');
      }

      return payload.sub; // userId
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  //metodo por si el token del usuario esta expuesto
  async rotateRefreshToken(oldToken: string): Promise<string> {
    const userId = await this.validateRefreshToken(oldToken);

    // Revoca el token viejo
    await this.prisma.refreshToken.updateMany({
      where: { token: oldToken },
      data: { revoked: true },
    });

    // Crear uno nuevo
    const newToken = this.refreshJwtService.sign({ sub: userId });

    await this.prisma.refreshToken.create({
      data: { token: newToken, userId },
    });

    return newToken;
  }

  async revokeAllRefreshTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
    const userId = await this.validateRefreshToken(refreshToken);

    // Generar un nuevo accessToken
    const accessToken = this.jwtService.sign({ sub: userId });

    // Rotar el refreshToken (invalida el viejo y crea uno nuevo)
    const newRefreshToken = await this.rotateRefreshToken(refreshToken);

    // Buscar al usuario para devolverlo en la respuesta
    const user = await this.userService.findOne(userId);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        ...user,
        friends: [],
        gameHistory: [],
        gameFavorites: [],
        notifications: [],
        chats: [],
      },
    };
  }
}
