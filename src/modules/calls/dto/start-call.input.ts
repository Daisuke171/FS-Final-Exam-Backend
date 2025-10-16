import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsString } from 'class-validator';

@InputType()
export class StartCallInput {
  @Field(() => ID)
  @IsUUID()
  callerId!: string;

  @Field(() => ID)
  @IsUUID()
  calleeId!: string;

  @Field()
  @IsString()
  sdpOffer!: string; 
}