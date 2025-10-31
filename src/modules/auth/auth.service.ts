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
import { GoogleAuthInput } from './inputs/google-auth.input';

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

  private async cleanupOldRefreshTokens(userId: string, maxTokens: number = 5) {
    const activeTokensCount = await this.prisma.refreshToken.count({
      where: { userId, revoked: false },
    });

    if (activeTokensCount >= maxTokens) {
      const tokensToDelete = await this.prisma.refreshToken.findMany({
        where: { userId, revoked: false },
        orderBy: { issuedAt: 'asc' },
        take: activeTokensCount - maxTokens + 1,
        select: { id: true },
      });

      await this.prisma.refreshToken.deleteMany({
        where: {
          id: {
            in: tokensToDelete.map((t) => t.id),
          },
        },
      });

      console.log(
        `🧹 Limpiados ${tokensToDelete.length} tokens antiguos para usuario ${userId}`,
      );
    }
  }

  async cleanupExpiredTokens() {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    const deleted = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } }, // Tokens expirados
          { revoked: true }, // Tokens revocados
          {
            usedAt: {
              not: null,
              lt: twoMinutesAgo,
            },
          }, // Tokens usados hace más de 2 minutos
        ],
      },
    });

    console.log(
      `🧹 Limpiados ${deleted.count} tokens expirados/revocados/usados`,
    );
    return deleted.count;
  }

  async googleAuth(googleAuthInput: GoogleAuthInput): Promise<AuthResponse> {
    const { email, name, googleId } = googleAuthInput;
    const normalizedEmail = email.toLowerCase().trim();

    try {
      let user = await this.prisma.user.findFirst({
        where: {
          OR: [{ email: normalizedEmail }, { googleId }],
        },
        include: {
          level: true,
          skins: {
            where: {
              active: true,
            },
            include: {
              skin: true,
            },
          },
        },
      });

      if (user) {
        if (!user.googleId) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { googleId },
            include: {
              level: true,
              skins: {
                where: {
                  active: true,
                },
                include: {
                  skin: true,
                },
              },
            },
          });
        }

        console.log('✅ Usuario de Google encontrado:', user.email);
      } else {
        console.log('👤 Creando nuevo usuario desde Google...');

        const initialLevel = await this.prisma.level.findFirst({
          where: { experienceRequired: 0 },
        });

        if (!initialLevel) {
          throw new InternalServerErrorException('Initial level not found');
        }

        const baseUsername = normalizedEmail
          .split('@')[0]
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '');

        let username = baseUsername;
        let counter = 1;

        while (await this.prisma.user.findUnique({ where: { username } })) {
          username = `${baseUsername}${counter}`;
          counter++;
        }

        const baseNickname = name
          .replace(/\s+/g, '_')
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '')
          .slice(0, 10);

        let nickname = baseNickname || username;
        counter = 1;

        while (await this.prisma.user.findUnique({ where: { nickname } })) {
          nickname = `${baseNickname || username}${counter}`;
          counter++;
        }

        const nameParts = name.split(' ');
        const firstName = nameParts[0] || name;
        const lastName = nameParts.slice(1).join(' ') || 'Google';

        user = await this.prisma.user.create({
          data: {
            email: normalizedEmail,
            username,
            nickname,
            name: firstName,
            lastname: lastName,
            birthday: new Date('2000-01-01'),
            googleId,
            levelId: initialLevel.id,
          },
          include: {
            level: true,
            skins: {
              where: {
                active: true,
              },
              include: {
                skin: true,
              },
            },
          },
        });

        console.log('✅ Usuario creado desde Google:', user.email);
      }

      const accessToken = this.jwtService.sign({ sub: user.id });
      const refreshToken = this.refreshJwtService.sign({ sub: user.id });

      const decoded = this.jwtService.decode(accessToken);
      console.log(
        '⏰ Access token creado - expira en:',
        new Date(decoded.exp * 1000),
      );
      console.log(
        '⏱️ Tiempo de vida del access token:',
        Math.floor((decoded.exp - decoded.iat) / 60),
        'minutos',
      );

      await this.cleanupOldRefreshTokens(user.id, 5);

      await this.prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const { password: _password, ...safeUser } = user;
      void _password;

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
      console.error('❌ Error en googleAuth:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'No se pudo autenticar con Google',
      );
    }
  }

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

      if (!user.password) {
        console.warn(
          `Login fallido: no se encontró contraseña para el usuario ${user.username}`,
        );
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

      const decoded = this.jwtService.decode(accessToken);
      console.log(
        '⏰ Access token creado - expira en:',
        new Date(decoded.exp * 1000),
      );
      console.log(
        '⏱️ Tiempo de vida del access token:',
        Math.floor((decoded.exp - decoded.iat) / 60),
        'minutos',
      );

      await this.cleanupOldRefreshTokens(user.id, 5);

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
      console.log('🔍 Validando refresh token...');
      console.log('🧾 Token recibido:', token.substring(0, 30) + '...');

      // Verificar firma del JWT
      const payload = this.refreshJwtService.verify(token);
      console.log('✅ Payload decodificado:', payload);

      // Buscar en DB
      const stored = await this.prisma.refreshToken.findUnique({
        where: { token },
      });

      if (!stored) {
        console.warn('⚠️ Token no encontrado en DB');
        throw new UnauthorizedException('Refresh token no encontrado');
      }

      if (stored.revoked) {
        console.warn('⚠️ Token revocado en DB');
        throw new UnauthorizedException('Refresh token revocado');
      }

      if (stored.usedAt) {
        const timeSinceUsed = Date.now() - stored.usedAt.getTime();
        const GRACE_PERIOD = 60 * 1000; // 60 segundos

        if (timeSinceUsed > GRACE_PERIOD) {
          console.warn(
            `⚠️ Token usado hace ${Math.floor(timeSinceUsed / 1000)}s (fuera del período de gracia)`,
          );
          throw new UnauthorizedException('Refresh token ya fue utilizado');
        }

        console.log(
          `⏳ Token usado hace ${Math.floor(timeSinceUsed / 1000)}s (dentro del período de gracia - OK)`,
        );
      }

      // Verificar expiración en base de datos también
      if (stored.expiresAt && stored.expiresAt < new Date()) {
        console.warn('⚠️ Token expirado en DB');
        throw new UnauthorizedException('Refresh token expirado');
      }

      console.log('✅ Refresh token válido para usuario:', payload.sub);
      return payload.sub;
    } catch (error) {
      console.error('❌ Error en validateRefreshToken:', error);
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  //metodo por si el token del usuario esta expuesto
  async rotateRefreshToken(oldToken: string): Promise<string> {
    const userId = await this.validateRefreshToken(oldToken);

    // Revoca el token viejo
    await this.prisma.refreshToken.update({
      where: { token: oldToken },
      data: { usedAt: new Date() },
    });

    // Crear uno nuevo
    const newToken = this.refreshJwtService.sign({ sub: userId });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.cleanupOldRefreshTokens(userId, 5);

    await this.prisma.refreshToken.create({
      data: { token: newToken, userId, expiresAt },
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
