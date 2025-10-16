import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';
import { IsUUID, IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

@ObjectType()
export class ChatMessage {
  @Field(() => ID)
  @IsUUID()
  id!: string;

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

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  status!: string;

  @Field()
  @IsBoolean()
  read!: boolean;

  @Field(() => GraphQLISODateTime)
  timestamp!: Date;
}
