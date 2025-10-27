// src/modules/game-favorite/dto/toggle-favorite.input.ts
import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class ToggleFavoriteInput {
  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  gameId: string;
}
