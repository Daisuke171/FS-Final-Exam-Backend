import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/models/user.model';
import { Game } from './game.model';

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

  @Field(() => User, { nullable: true })
  user?: User;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
