import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field()
  name!: string;

  @Field()
  lastname!: string;

  @Field()
  nickname!: string;

  @Field()
  username!: string;

  @Field()
  birthday!: Date;

  @Field(() => Int)
  levelId!: number;

  @Field()
  createdAt!: Date;
}
