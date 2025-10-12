import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class RequestFriendByUsernameInput {
  @Field(() => ID)
  requesterId!: string;

  @Field()
  username!: string;
}
