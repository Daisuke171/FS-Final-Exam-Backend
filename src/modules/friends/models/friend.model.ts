import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';
import { User } from '../../user/user.model';

@ObjectType()
export class Friend {
  @Field(() => ID)
  id!: string;

  @Field()
  status!: string;

  @Field()
  active!: boolean;

  @Field(() => ID)
  requesterId!: string;

  @Field(() => ID)
  receiverId!: string;

  @Field(() => User, { nullable: true })
  requester?: User;

  @Field(() => User, { nullable: true })
  receiver?: User;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}
