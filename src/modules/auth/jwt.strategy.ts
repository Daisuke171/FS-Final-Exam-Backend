import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

type JwtPayload = {
  sub: string;
  username: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET') || 'secret';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Token inválido o usuario no encontrado.',
      );
    }

    return user;
  }
}
