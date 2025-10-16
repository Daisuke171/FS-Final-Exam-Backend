import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsString } from 'class-validator';

@InputType()
export class AnswerCallInput {
  @Field(() => ID)
  @IsUUID()
  callId!: string;

  @Field(() => ID)
  @IsUUID()
  calleeId!: string; // ID del usuario que responde

  @Field()
  @IsString()
  sdpAnswer!: string;
}