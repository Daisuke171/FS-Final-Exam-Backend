import { Module } from '@nestjs/common';
import { RoomModule } from './modules/games/web-sockets/coding-war/room/room.module';
import { LevelModule } from './modules/level/level.module';
import { UserModule } from './modules/user/user.module';
import { ChatGateway } from './modules/chat/chat.gateway';
import { CodingWarModule } from './modules/games/web-sockets/coding-war/coding-war.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { RpsModule } from './modules/games/web-sockets/rock-paper-scissors/rps.module';
import { GamesModule } from './modules/games/games.module';
import { AuthModule } from './modules/auth/auth.module';
import { SkinsResolver } from './modules/skins/skins.resolver';
import { SkinsModule } from './modules/skins/skins.module';
import { UserSkinsService } from './modules/user-skins/user-skins.service';
import { UserSkinsResolver } from './modules/user-skins/user-skins.resolver';
import { UserSkinsModule } from './modules/user-skins/user-skins.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      playground: true,
    }),
    CodingWarModule,
    RpsModule,
    GamesModule,
    LevelModule,
    UserModule,
    RoomModule,
    AuthModule,
    SkinsModule,
    UserSkinsModule,
  ],
  controllers: [],
  providers: [ChatGateway, SkinsResolver, UserSkinsService, UserSkinsResolver],
})
export class AppModule {}
