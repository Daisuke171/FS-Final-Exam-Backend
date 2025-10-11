import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
import { User } from '../../users/models/user.model';
import { Game } from './game.model';

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

  @Field(() => User, { nullable: true })
  user?: User;

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
