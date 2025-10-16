import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class ToggleFavoriteInput {
  @Field(() => ID)
  @IsNotEmpty()
  userId: string;

  @Field(() => ID)
  @IsNotEmpty()
  gameId: string;
}
