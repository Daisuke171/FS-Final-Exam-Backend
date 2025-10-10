import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from './user.model';

@ObjectType()
export class Notification {
  @Field(() => ID)
  Id: string;

  @Field()
  type: string;

  @Field()
  entity: string;

  @Field(() => User)
  user: User;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
