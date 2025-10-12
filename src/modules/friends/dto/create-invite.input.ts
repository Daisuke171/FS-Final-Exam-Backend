import { InputType, Field, ID, Int } from '@nestjs/graphql';

@InputType()
export class CreateFriendInviteInput {
  @Field(() => ID)
  inviterId!: string;

  @Field({ nullable: true })
  targetUsername?: string;

  // horas hasta expirar (default 24)
  @Field(() => Int, { defaultValue: 24 })
  ttlHours?: number;
}
