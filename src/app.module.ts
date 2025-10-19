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
import { CommonModule } from './common/common.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
    UploadsModule,
    ChatModule,
    CommonModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
