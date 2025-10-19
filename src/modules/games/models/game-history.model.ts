import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
// import { User } from '../../users/models/user.model';
import { Game } from './game.model';
import { UserGraph } from 'src/modules/user/models/user.model';

@ObjectType()
export class GameHistory {
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

  @Field(() => Int)
  duration: number;

  @Field()
  state: string;

  @Field(() => Int)
  score: number;

  @Field(() => Int)
  totalDamage: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
