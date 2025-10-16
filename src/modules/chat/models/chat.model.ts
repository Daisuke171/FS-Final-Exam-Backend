import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';
import { ChatMessage } from './chat-message.model';
import { User } from '@modules/user/models/user.model';

@ObjectType()
export class Chat {
  @Field(() => ID)
  id!: string;

  @Field(() => User)
  userId!: User;

  @Field(() => User)
  friendId!: User;

  @Field(() => [ChatMessage])
  messages!: ChatMessage[];

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}

