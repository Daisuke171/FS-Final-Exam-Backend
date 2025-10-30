import { Module } from '@nestjs/common';
import { LevelModule } from './modules/level/level.module';
import { UserModule } from './modules/user/user.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { RpsModule } from './modules/games/web-sockets/rock-paper-scissors/rps.module';
import { GamesModule } from './modules/games/games.module';
import { AuthModule } from './modules/auth/auth.module';
import { SkinsModule } from './modules/skins/skins.module';
import { UserSkinModule } from './modules/user-skins/user-skins.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { ChatModule } from './modules/chat/chat.module';
import { FriendsModule } from './modules/friends/friends.module';
import { CommonModule } from './common/common.module';
import { ConfigModule } from '@nestjs/config';
import { CodingWarModule } from '@modules/games/web-sockets/coding-war/coding-war.module';
import { TuringDetectiveModule } from '@modules/games/web-sockets/turing-detective/turing-detective.module';
import { join } from 'path';
import { CallsModule } from './modules/calls/calls.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'), // or true for in-memory schema
      sortSchema: true,
      playground: true,
      introspection: true,
      subscriptions: {
        'graphql-ws': true,
      },
      cors: {
        origin: process.env.NODE_ENV !== 'production' 
          ? [
              'http://localhost:3000',
              'http://localhost:3001',
            ]
          : [
              'https://fs-final-exam-frontend.vercel.app',
              /^https:\/\/.*\.vercel\.app$/,
              /^https:\/\/fs-final-exam-frontend-.*\.vercel\.app$/,
            ],
        credentials: true,
      },
    }),
    RpsModule,
    GamesModule,
    LevelModule,
    UserModule,
    AuthModule,
    SkinsModule,
    UserSkinModule,
    FriendsModule,
    ChatModule,
    CallsModule,
    UploadsModule,
    CommonModule,
    CodingWarModule,
    TuringDetectiveModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
