import { ObjectType, Field, Int } from '@nestjs/graphql';
import { User } from './user.model';
import { Skin } from '@modules/skins/models/skins.model';

@ObjectType()
export class LevelUpResponse {
  @Field(() => User)
  user: User;

  @Field()
  leveledUp: boolean;

  @Field(() => Int)
  previousLevel: number;

  @Field(() => Int)
  newLevel: number;

  @Field(() => [Skin])
  unlockedSkins: Skin[];
}
