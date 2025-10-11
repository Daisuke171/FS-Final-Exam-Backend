import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class Level {
  @Field(() => ID)
  Id: number;

  @Field(() => Int)
  number: number;

  @Field()
  name: string;

  @Field()
  color: string;

  @Field(() => Int)
  experienceRequired: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
