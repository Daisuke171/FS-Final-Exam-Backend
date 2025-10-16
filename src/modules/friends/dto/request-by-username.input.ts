import { InputType, Field, ID } from '@nestjs/graphql';
import { IsString, IsUUID } from 'class-validator';

@InputType()
export class RequestFriendByUsernameInput {
  @Field(() => ID)
  @IsUUID()
  requesterId!: string;

  @Field()
  @IsString()
  username!: string;
}
