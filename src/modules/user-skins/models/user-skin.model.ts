import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '@modules/user/models/user.model';
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

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => Skin, { nullable: true })
  skin?: Skin;
}
