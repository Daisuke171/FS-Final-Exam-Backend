import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';
import { User } from '../../user/models/user.model';

@ObjectType()
export class Notification {
  @Field(() => ID)
  id!: string;

  @Field()
  type!: string;

  @Field()
  entity!: string;

  @Field(() => User)
  user!: User;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}
