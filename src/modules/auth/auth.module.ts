import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from 'prisma/prisma.module';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { UserModule } from '@modules/user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';

function required(name: string, value?: string) {
  if (!value) throw new Error(`[Auth] Missing env: ${name}`);
  return value;
}
@Module({
  imports: [
    UserModule,
    PrismaModule,
    PassportModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: required('JWT_SECRET', config.get<string>('JWT_SECRET')),
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ||
            '15m') as StringValue,
        },
      }),
    }),
  ],
  providers: [
    JwtStrategy,
    GqlAuthGuard,
    AuthResolver,
    AuthService,
    {
      provide: 'JWT_REFRESH_SERVICE',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new JwtService({
          secret: config.get<string>('JWT_REFRESH_SECRET'),
          signOptions: {
            expiresIn: (config.get<string>('JWT_REFRESH_EXPIRES_IN') ||
              '7d') as StringValue,
          },
        });
      },
    },
  ],
  exports: [AuthService, JwtModule, JwtStrategy, GqlAuthGuard],
})
export class AuthModule {}
