import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

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
})
export class AppModule { }
