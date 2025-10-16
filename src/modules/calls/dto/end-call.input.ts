import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsOptional, IsString } from 'class-validator';

@InputType()
export class EndCallInput {
  @Field(() => ID)
  @IsUUID()
  callId!: string;

  @Field(() => ID)
  @IsUUID()
  userId!: string; // quien cuelga

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;
}
