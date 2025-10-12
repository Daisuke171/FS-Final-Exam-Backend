import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class AcceptFriendInviteInput {
  @Field()
  token!: string; // token claro del URL

  @Field(() => ID)
  receiverId!: string;
}
