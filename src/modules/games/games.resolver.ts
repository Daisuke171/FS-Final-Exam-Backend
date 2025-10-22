import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { GamesService } from './games.service';
import { Game } from './models/game.model';
import { CreateGameInput } from './inputs/create-game.input';
import { UpdateGameInput } from './inputs/update-game.input';
import { SaveGameResultInput } from './inputs/save-game.input';
import { GameFavorite } from './models/game-favorite.model';
import { Leaderboard } from './models/leaderboard.model';
import { GameHistory } from './models/game-history.model';
import { UserStats } from './models/user-stats.model';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { UserGraph } from '@modules/user/models/user.model';
import { GqlAuthGuard } from '@modules/auth/guards/gql-auth.guard';
import { UseGuards } from '@nestjs/common';

@Resolver(() => Game)
export class GamesResolver {
  constructor(private readonly gamesService: GamesService) {}

  @Query(() => [Game])
  async games() {
    return this.gamesService.findAll();
  }

  @Query(() => Game)
  async game(@Args('id', { type: () => ID }) id: string) {
    return this.gamesService.findOne(id);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [GameHistory], { name: 'userGames' })
  async userGames(
    @CurrentUser() user: UserGraph,
    @Args('gameId', { type: () => ID, nullable: true }) gameId?: string,
  ) {
    return this.gamesService.getUserGameHistory(user.id, gameId);
  }

  @Query(() => Leaderboard, { name: 'leaderboard' })
  async getLeaderboard(@Args('gameId', { type: () => ID }) gameId: string) {
    return this.gamesService.getLeaderboard(gameId);
  }

  @Query(() => Leaderboard, { name: 'globalLeaderboard' })
  async getGlobalLeaderboard() {
    return this.gamesService.getGlobalLeaderboard();
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => UserStats, { name: 'userStats' })
  async getUserStats(
    @CurrentUser() user: UserGraph,
    @Args('gameId', { type: () => ID, nullable: true }) gameId?: string,
  ) {
    return this.gamesService.getUserStats(user.id, gameId);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [GameFavorite], { name: 'userFavorites' })
  async getUserFavorites(@CurrentUser() user: UserGraph) {
    return this.gamesService.getUserFavorites(user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async toggleFavorite(
    @CurrentUser() user: UserGraph,
    @Args('gameId', { type: () => ID }) gameId?: string,
  ) {
    return this.gamesService.toggleFavorite(user.id, gameId);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => GameHistory)
  async saveGameResult(
    @Args('input') input: SaveGameResultInput,
    @CurrentUser() user: UserGraph,
  ) {
    return this.gamesService.saveGameResult(input, user.id);
  }

  @Mutation(() => Game)
  async createGame(@Args('input') input: CreateGameInput) {
    return this.gamesService.createGame(input);
  }

  @Mutation(() => Game)
  async deleteGame(@Args('id', { type: () => ID }) id: string) {
    return this.gamesService.deleteGame(id);
  }

  @Mutation(() => Game)
  async updateGame(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateGameInput,
  ) {
    return this.gamesService.updateGame(id, input);
  }
}
