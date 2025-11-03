import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { UserGraph } from '@modules/user/models/user.model';
import { UserMissionProgress } from './user-mission.model';
import { Skin } from '@modules/skins/models/skins.model';

@ObjectType()
export class MissionRewards {
  @Field(() => Int)
  xp: number;

  @Field(() => Float)
  coins: number;
}

@ObjectType()
export class LevelProgressData {
  @Field(() => Int)
  xpGained: number;

  @Field()
  leveledUp: boolean;

  @Field(() => Int)
  oldLevel: number;

  @Field(() => Int)
  newLevel: number;

  @Field(() => [Skin])
  unlockedSkins: Skin[];

  @Field(() => Float)
  xpInCurrentLevelBefore: number;

  @Field(() => Float, { nullable: true })
  xpNeededForLevelBefore?: number;

  @Field(() => Float)
  progressBefore: number;

  @Field(() => Float)
  xpInCurrentLevelAfter: number;

  @Field(() => Float, { nullable: true })
  xpNeededForLevelAfter?: number;

  @Field(() => Float)
  progressAfter: number;

  @Field()
  oldLevelName: string;

  @Field()
  oldLevelSymbol: string;

  @Field()
  oldLevelColor: string;

  @Field()
  newLevelName: string;

  @Field()
  newLevelSymbol: string;

  @Field()
  newLevelColor: string;
}

@ObjectType()
export class ClaimRewardResponse {
  @Field(() => UserGraph)
  user: UserGraph;

  @Field(() => UserMissionProgress)
  progress: UserMissionProgress;

  @Field(() => MissionRewards)
  rewards: MissionRewards;

  @Field(() => LevelProgressData)
  levelData: LevelProgressData;
}
