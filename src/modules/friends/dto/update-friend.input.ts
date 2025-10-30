import { InputType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { IsUUID, IsString, IsNotEmpty } from 'class-validator';

export enum FriendStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  BLOCKED = 'BLOCKED',
}
registerEnumType(FriendStatus, { name: 'FriendStatus' });

@InputType()
export class UpdateFriendStatusInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field(() => FriendStatus)
  @IsString()
  @IsNotEmpty()
  status!: FriendStatus;
}
