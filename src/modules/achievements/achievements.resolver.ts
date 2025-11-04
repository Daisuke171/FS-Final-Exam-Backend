import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { GqlAuthGuard } from '@modules/auth/guards/gql-auth.guard';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { UserGraph } from '@modules/user/models/user.model';
import {
  UserAchievementResponse,
  UnseenAchievementResponse,
  AchievementStatsResponse,
} from './models/achievement.model';

@Resolver()
export class AchievementsResolver {
  constructor(private readonly achievementsService: AchievementsService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => [UserAchievementResponse], { name: 'myAchievements' })
  async getUserAchievements(@CurrentUser() user: UserGraph) {
    return this.achievementsService.getUserAchievements(user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => AchievementStatsResponse, { name: 'achievementStats' })
  async getAchievementStats(@CurrentUser() user: UserGraph) {
    return this.achievementsService.getAchievementStats(user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [UnseenAchievementResponse], { name: 'unseenAchievements' })
  getUnseenAchievements(@CurrentUser() user: UserGraph) {
    return this.achievementsService.getUnseenAchievements(user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async markAchievementsAsSeen(
    @CurrentUser() user: UserGraph,
    @Args('achievementIds', { type: () => [ID] }) achievementIds: string[],
  ) {
    await this.achievementsService.markAsSeen(user.id, achievementIds);
    return true;
  }
}
