import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class AcceptFriendInviteInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  token: string; // token claro del URL

  @Field(() => ID)
  @IsUUID()
  receiverId: string;
}
