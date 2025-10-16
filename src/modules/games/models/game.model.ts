import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
import { GameHistory } from './game-history.model';
import { GameFavorite } from './game-favorite.model';

@ObjectType()
export class Game {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  rules?: string;

  @Field({ nullable: true })
  gameLogo?: string;

  @Field(() => Int)
  score: number;

  @Field()
  duration: string;

  @Field()
  category: string;

  @Field(() => Int, { defaultValue: 1 })
  minPlayers: number;

  @Field(() => Int, { defaultValue: 1 })
  maxPlayers: number;

  @Field(() => [GameHistory], { nullable: 'items' })
  history?: GameHistory[];

  @Field(() => [GameFavorite], { nullable: 'items' })
  favorite?: GameFavorite[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
