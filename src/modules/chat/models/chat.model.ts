import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';
import { ChatMessage } from './chat-message.model';
import { IsUUID, IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

@ObjectType()
export class Chat {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field(() => ID)
  @IsUUID()
  userId!: string;

  @Field(() => ID)
  @IsUUID()
  friendId!: string;

  @Field(() => [ChatMessage])
  @IsOptional()
  messages!: ChatMessage[];

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}

