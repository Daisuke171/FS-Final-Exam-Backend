import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsBoolean } from 'class-validator';

@InputType()
export class ToggleFriendActiveInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field()
  @IsBoolean()
  active!: boolean;
}