// src/modules/game-favorite/game-favorite.resolver.ts
import { Resolver, Mutation, Args, ID } from '@nestjs/graphql';
import { GameFavoriteService } from './game-favorite.service';

@Resolver()
export class GameFavoriteResolver {
  constructor(private readonly service: GameFavoriteService) {}

  @Mutation(() => Boolean, { name: 'toggleFavorite' })
  async toggleFavorite(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('gameId', { type: () => ID }) gameId: string,
  ): Promise<boolean> {
    return this.service.toggle({ userId, gameId });
  }
}


