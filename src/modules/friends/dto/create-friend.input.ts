import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class CreateFriendInput {
  @Field(() => ID)
  userId!: string;         // dueño del registro

  @Field({ defaultValue: 'pending' })
  status?: string;

  @Field({ defaultValue: false })
  active?: boolean;
}