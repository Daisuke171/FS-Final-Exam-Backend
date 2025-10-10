import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class ChatMessage {
  @Field(() => ID)
  Id: string;

  @Field()
  chatId: string;

  @Field()
  senderId: string;

  @Field()
  message: string;

  @Field()
  status: string;

  @Field()
  read: boolean;

  @Field()
  timestamp: Date;
}
