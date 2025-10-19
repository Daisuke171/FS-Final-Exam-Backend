import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';
import { UserGraph } from '../../user/models/user.model';

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

  @Field(() => UserGraph, { nullable: true })
  requester?: UserGraph;

  @Field(() => UserGraph, { nullable: true })
  receiver?: UserGraph;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}
