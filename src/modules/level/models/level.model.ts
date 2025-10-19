import { Field, Int, ObjectType } from '@nestjs/graphql';
import { UserGraph } from '@modules/user/models/user.model';

@ObjectType()
export class Level {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  experienceRequired: number;

  @Field()
  name: string;

  @Field(() => Int)
  atomicNumber: number;

  @Field(() => String)
  chemicalSymbol: string;

  @Field()
  color: string;

  @Field(() => [UserGraph], { nullable: true })
  users?: UserGraph[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class CreateManyResult {
  @Field(() => Int)
  count: number;
}
