import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ChatMessage } from './chat-message.model';
import { User } from './user.model';

@ObjectType()
export class Chat {
  @Field(() => ID)
  Id: string;

  @Field(() => User)
  user: User;

  @Field(() => [ChatMessage])
  messages: ChatMessage[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
