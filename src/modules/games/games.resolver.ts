import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { GamesService } from './games.service';
import { Game } from './models/game.model';
import { CreateGameInput } from './inputs/create-game.input';
import { UpdateGameInput } from './inputs/update-game.input';
import { SaveGameResultInput } from './inputs/save-game.input';
import { ToggleFavoriteInput } from './inputs/togle-favorite.input';
import { GameFavorite } from './models/game-favorite.model';
import { Leaderboard } from './models/leaderboard.model';
import { GameHistory } from './models/game-history.model';
import { UserStats } from './models/user-stats.model';

@Resolver(() => Game)
export class GamesResolver {
  constructor(private readonly gamesService: GamesService) {}

  @Query(() => [Game])
  async games() {
    return this.gamesService.findAll();
  }

  @Query(() => Game)
  async game(@Args('id', { type: () => Int }) id: string) {
    return this.gamesService.findOne(id);
  }

  @Query(() => [GameHistory], { name: 'userGames' })
  async userGames(
    @Args('userId', { type: () => Int }) userId: string,
    @Args('gameId', { type: () => Int }) gameId: string,
  ) {
    return this.gamesService.getUserGameHistory(userId, gameId);
  }

  @Query(() => Leaderboard, { name: 'leaderboard' })
  async getLeaderboard(@Args('gameId', { type: () => Int }) gameId: string) {
    return this.gamesService.getLeaderboard(gameId);
  }

  @Query(() => Leaderboard, { name: 'globalLeaderboard' })
  async getGlobalLeaderboard() {
    return this.gamesService.getGlobalLeaderboard();
  }

  @Query(() => UserStats, { name: 'userStats' })
  async getUserStats(
    @Args('userId', { type: () => Int }) userId: string,
    @Args('gameId', { type: () => Int }) gameId?: string,
  ) {
    return this.gamesService.getUserStats(userId, gameId);
  }

  @Query(() => [GameFavorite], { name: 'userFavorites' })
  async getUserFavorites(@Args('userId', { type: () => Int }) userId: string) {
    return this.gamesService.getUserFavorites(userId);
  }

  @Mutation(() => Boolean)
  async toggleFavorite(@Args('input') input: ToggleFavoriteInput) {
    return this.gamesService.toggleFavorite(input);
  }

  @Mutation(() => GameHistory)
  async saveGameResult(@Args('input') input: SaveGameResultInput) {
    return this.gamesService.saveGameResult(input);
  }

  @Mutation(() => Game)
  async createGame(@Args('input') input: CreateGameInput) {
    return this.gamesService.createGame(input);
  }

  @Mutation(() => Game)
  async deleteGame(@Args('id', { type: () => Int }) id: string) {
    return this.gamesService.deleteGame(id);
  }

  @Mutation(() => Game)
  async updateGame(
    @Args('id', { type: () => Int }) id: string,
    @Args('input') input: UpdateGameInput,
  ) {
    return this.gamesService.updateGame(id, input);
  }
}
