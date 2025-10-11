import { Field, Int, ObjectType } from '@nestjs/graphql';
import { User } from 'src/modules/users/models/user.model';

@ObjectType()
export class Level {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  experienceRequired: number;

  @Field()
  name: string;

  @Field(() => Int)
  number: number;

  @Field()
  color: string;

  @Field(() => [User], { nullable: true })
  users?: User[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
