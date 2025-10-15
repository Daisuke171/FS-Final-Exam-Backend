import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { User } from 'src/modules/user/models/user.model';

@ObjectType()
export class Skin {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  img: string;

  @Field(() => Int)
  level: number;

  @Field(() => Float)
  value: number;

  @Field(() => [User], { nullable: 'itemsAndList' })
  users?: User[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
