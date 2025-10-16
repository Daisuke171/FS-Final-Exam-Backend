import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsOptional, IsNumber, IsString } from 'class-validator';

@InputType()
export class IceCandidateInput {
  @Field(() => ID)
  @IsUUID()
  callId!: string;

  @Field(() => ID)
  @IsUUID()
  fromUserId!: string; // quién envía

  @Field()
  @IsString()
  candidate!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sdpMid?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  sdpMLineIndex?: number;
}
