import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserGraph } from '@modules/user/models/user.model';
import { Skin } from '@modules/skins/models/skins.model';

@ObjectType()
export class UserSkin {
  @Field(() => ID)
  id!: string;

  @Field()
  userId!: string;

  @Field()
  skinId!: string;

  @Field()
  active!: boolean;

  @Field()
  acquiredAt!: Date;

  @Field(() => UserGraph, { nullable: true })
  user?: UserGraph;

  @Field(() => Skin, { nullable: true })
  skin?: Skin;
}
