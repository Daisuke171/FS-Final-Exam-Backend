import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
@InputType()
export class SendMessageInput {
  @Field(() => ID)
  @IsUUID()
  chatId!: string;

  @Field(() => ID)
  @IsUUID()
  senderId!: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  message!: string;
}