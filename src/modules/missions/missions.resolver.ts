import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { GqlAuthGuard } from '@modules/auth/guards/gql-auth.guard';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { UserGraph } from '@modules/user/models/user.model';
import { UserMission } from './models/user-mission.model';
import { ClaimRewardResponse } from './models/claim-reward-response.model';
import { CreateMissionInput } from './inputs/create-mission.input';
import { UpdateMissionInput } from './inputs/update-mission.input';

@Resolver()
export class MissionsResolver {
  constructor(private readonly missionsService: MissionsService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => [UserMission], { name: 'myMissions' })
  async getUserMissions(@CurrentUser() user: UserGraph) {
    // Inicializar misiones si es la primera vez
    await this.missionsService.initializeUserMissions(user.id);
    return this.missionsService.getUserMissions(user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => ClaimRewardResponse)
  async claimMissionReward(
    @CurrentUser() user: UserGraph,
    @Args('missionId', { type: () => ID }) missionId: string,
  ) {
    return this.missionsService.claimReward(user.id, missionId);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async initializeMissions(@CurrentUser() user: UserGraph) {
    await this.missionsService.initializeUserMissions(user.id);
    return true;
  }

  // ADMIN MUTATIONS
  @Mutation(() => UserMission)
  async createMission(@Args('input') input: CreateMissionInput) {
    return this.missionsService.createMission(input);
  }

  @Mutation(() => UserMission)
  async updateMission(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateMissionInput,
  ) {
    return this.missionsService.updateMission(id, input);
  }

  @Mutation(() => Boolean)
  async deleteMission(@Args('id', { type: () => ID }) id: string) {
    await this.missionsService.deleteMission(id);
    return true;
  }
}
