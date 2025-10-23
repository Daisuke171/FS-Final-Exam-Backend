import { ObjectType, Field, ID } from '@nestjs/graphql';
// import { User } from '../../users/models/user.model';
import { Game } from './game.model';
import { UserGraph } from 'src/modules/user/models/user.model';

@ObjectType()
export class GameFavorite {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  gameId: string;

  @Field(() => Game, { nullable: true })
  game?: Game;

  @Field(() => ID)
  userId: string;

  @Field(() => UserGraph, { nullable: true })
  user?: UserGraph;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
