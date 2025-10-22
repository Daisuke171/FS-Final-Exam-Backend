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
import { UserGraph } from 'src/modules/user/models/user.model'; // el de GraphQL
import { UserService } from '../user/user.service';
import { LoginInput } from '../auth/inputs/login.input';
import { AuthResponse } from '../auth/responses/auth.response';

type UserWithLevel = PrismaUser & { level: Level };

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

    let initialLevel = await this.prisma.level.findFirst({
      where: { experienceRequired: 0 },
    });

    if (existingUser) {
      const conflicts: Record<string, string> = {
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

    //buscar email o username
    const user = await this.userService.findByEmailOrUsername(usernameOrEmail);

    //validar password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    const genericError = new UnauthorizedException('Credenciales inválidas');

    if (!isPasswordValid) {
      throw genericError;
    }
    const { password: _removed, ...safeUser } = user;
    void _removed;
    //token acceso
    const accessToken = this.jwtService.sign({ sub: user.id });
    return {
      accessToken,
      user: {
        ...(safeUser as Omit<
          UserGraph,
          | 'skins'
          | 'friends'
          | 'gameHistory'
          | 'gameFavorites'
          | 'notifications'
          | 'chats'
        >),
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
