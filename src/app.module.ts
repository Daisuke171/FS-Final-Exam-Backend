import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

import { RoomModule } from './modules/games/web-sockets/coding-war/room/room.module';

import { CodingWarModule } from './modules/games/web-sockets/coding-war/coding-war.module';


import { AuthModule } from './modules/auth/auth.module';
import { RpsModule } from './modules/games/web-sockets/rock-paper-scissors/rps.module';
import { GamesModule } from './modules/games/games.module';
import { SkinResolver } from './modules/skins/skins.resolver';
import { SkinsModule } from './modules/skins/skins.module';
import { UserSkinService } from './modules/user-skins/user-skins.service';
import { UserSkinResolver } from './modules/user-skins/user-skins.resolver';
import { UserSkinModule } from './modules/user-skins/user-skins.module';

import { UserModule } from './modules/user/user.module';
import { LevelModule } from './modules/level/level.module';
import { ChatModule } from './modules/chat/chat.module';
import { CommonModule } from './common/common.module';
import { NotificationModule } from './modules/notification/notificacion.module';
import { FriendsModule } from './modules/friends/friends.module';
//import { CallsModule } from './modules/calls/calls.module';
@Module({
  imports: [
    CommonModule,
    UserModule,
    LevelModule,
    ChatModule,
    NotificationModule,
    FriendsModule,
    /* CodingWarModule, */
    RpsModule,
    GamesModule,
    RoomModule,
    AuthModule,
    SkinsModule,
    UserSkinModule,
    //   CallsModule,
    // http://localhost:3010/graphql for playground
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'), // or true for in-memory schema
      sortSchema: true,
      playground: true, // This enables the GraphQL Playground
      subscriptions: {
        'graphql-ws': true
      },
    }),
  ],
  controllers: [],
})
export class AppModule { }
