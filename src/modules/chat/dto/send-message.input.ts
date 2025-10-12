import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class SendMessageInput {
  @Field(() => ID) chatId!: string;
  @Field(() => ID) senderId!: string;
  @Field() message!: string;
}