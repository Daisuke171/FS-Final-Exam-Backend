import { InputType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum FriendStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  BLOCKED  = 'BLOCKED',
}
registerEnumType(FriendStatus, { name: 'FriendStatus' });

@InputType()
export class UpdateFriendStatusInput {
  @Field(() => ID)
  id!: string;

  @Field(() => FriendStatus)
  status!: FriendStatus;
}
