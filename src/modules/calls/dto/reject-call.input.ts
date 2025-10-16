import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class RejectCallInput {
  @Field(() => ID)
  @IsUUID()
  callId!: string;

  @Field(() => ID)
  @IsUUID()
  calleeId!: string;
}
