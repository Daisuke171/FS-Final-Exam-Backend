import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class ToggleFriendActiveInput {
  @Field(() => ID)
  id!: string;

  @Field()
  active!: boolean;
}