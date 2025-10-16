import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';

@InputType()
export class CreateFriendInviteInput {
  @Field({ nullable: false })
  @IsUUID()
  inviterId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  targetUsername?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  ttlHours?: number;
}
