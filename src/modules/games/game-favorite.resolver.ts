import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GamesService } from './games.service';
import { GameFavorite } from './models/game-favorite.model';
import { GqlAuthGuard } from '@modules/auth/guards/gql-auth.guard';

@Resolver(() => GameFavorite)
@UseGuards(GqlAuthGuard)
export class GameFavoriteResolver {
  constructor(private readonly gamesService: GamesService) {}

  @ResolveField(() => Number, { nullable: true })
  async totalGames(@Parent() gameFavorite: GameFavorite) {
    const stats = await this.gamesService.getUserStats(
      gameFavorite.userId,
      gameFavorite.gameId,
    );
    return stats?.totalGames ?? 0;
  }

  @ResolveField(() => Number, { nullable: true })
  async winRate(@Parent() gameFavorite: GameFavorite) {
    const stats = await this.gamesService.getUserStats(
      gameFavorite.userId,
      gameFavorite.gameId,
    );
    return stats?.winRate ?? 0;
  }

  @ResolveField(() => String, { nullable: true })
  async lastPlayed(@Parent() gameFavorite: GameFavorite) {
    const lastGame = await this.gamesService.getLastGamePlayed(
      gameFavorite.userId,
      gameFavorite.gameId,
    );

    if (!lastGame) return 'Nunca';

    const now = new Date();
    const lastPlayedDate = new Date(lastGame.createdAt);
    const diffMs = now.getTime() - lastPlayedDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return lastPlayedDate.toLocaleDateString('es-ES');
  }
}
