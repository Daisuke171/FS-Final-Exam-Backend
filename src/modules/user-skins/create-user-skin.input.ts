import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateUserSkinInput {
  @Field()
  userId: string;

  @Field()
  skinId: string;

  @Field({ nullable: true })
  equipped?: boolean;
}
