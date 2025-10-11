import { Module } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module';
import { CodingWarModule } from './modules/games/web-sockets/coding-war/coding-war.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { RpsModule } from './modules/games/web-sockets/rock-paper-scissors/rps.module';
import { GamesModule } from './modules/games/games.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
    }),
    OrdersModule,
    CodingWarModule,
    RpsModule,
    GamesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
