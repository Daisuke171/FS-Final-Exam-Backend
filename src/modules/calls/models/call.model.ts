import { ObjectType, Field, ID, GraphQLISODateTime, registerEnumType } from '@nestjs/graphql';
import { IsUUID, IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export enum CallStatus {
  RINGING = 'RINGING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  ENDED = 'ENDED',
}
registerEnumType(CallStatus, { name: 'CallStatus' });

@ObjectType()
export class Call {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field(() => ID)
  @IsUUID()
  callerId!: string;

  @Field(() => ID)
  @IsUUID()
  calleeId!: string;

  @Field(() => CallStatus)
  @IsString()
  status!: CallStatus;

  @Field({ nullable: true })
  @IsOptional()
  sdpOffer?: string;

  @Field({ nullable: true })
  @IsOptional()
  sdpAnswer?: string;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}
