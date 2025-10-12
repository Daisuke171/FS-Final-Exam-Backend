import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class CreateNotificationInput {
  @Field()
  type!: string;

  @Field()
  entity!: string;

  @Field(() => ID)
  userId!: string;
}