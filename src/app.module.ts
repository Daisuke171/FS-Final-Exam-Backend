import { Module } from '@nestjs/common';
import { LevelModule } from './modules/level/level.module';
import { UserModule } from './modules/user/user.module';
import { ChatGateway } from './modules/chat/chat.gateway';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { RpsModule } from './modules/games/web-sockets/rock-paper-scissors/rps.module';
import { GamesModule } from './modules/games/games.module';
import { AuthModule } from './modules/auth/auth.module';
import { SkinsModule } from './modules/skins/skins.module';
import { UserSkinModule } from './modules/user-skins/user-skins.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      playground: true,
    }),
    RpsModule,
    GamesModule,
    LevelModule,
    UserModule,
    AuthModule,
    SkinsModule,
    UserSkinModule,
  ],
  controllers: [],
  providers: [ChatGateway],
})
export class AppModule {}
