import { ObjectType, Field, Int } from '@nestjs/graphql';
import { UserGraph } from './user.model';
import { Skin } from '@modules/skins/models/skins.model';

@ObjectType()
export class LevelUpResponse {
  @Field(() => UserGraph)
  user: UserGraph;

  @Field()
  leveledUp: boolean;

  @Field(() => Int)
  previousLevel: number;

  @Field(() => Int)
  newLevel: number;

  @Field(() => [Skin])
  unlockedSkins: Skin[];
}
