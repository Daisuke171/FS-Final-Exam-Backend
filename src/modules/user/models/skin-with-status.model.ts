import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SkinWithStatus {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  img: string;

  @Field(() => Int)
  level: number;

  @Field()
  category: string;

  @Field()
  isUnlocked: boolean;

  @Field()
  isOwned: boolean;

  @Field()
  isActive: boolean;

  @Field(() => ID, { nullable: true })
  userSkinId?: string;
}
