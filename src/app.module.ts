import { Module } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';
import { ChatGateway } from './modules/chat/chat.gateway';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { LevelModule } from './modules/level/level.module';

@Module({
  imports: [
    UserModule,
    // http://localhost:3010/graphql for playground
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql', // or true for in-memory schema
      playground: true, // This enables the GraphQL Playground
    }),
    LevelModule,
  ],
  providers: [ChatGateway],
})
export class AppModule {}
