import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';


@ObjectType()
export class ChatMessage {
  @Field(() => ID)
  id!: string;

  @Field()
  chatId!: string;

  @Field()
  senderId!: string;

  @Field()
  message!: string;

  @Field()
  status!: string;

  @Field()
  read!: boolean;

  @Field(() => GraphQLISODateTime)
  timestamp!: Date;
}
