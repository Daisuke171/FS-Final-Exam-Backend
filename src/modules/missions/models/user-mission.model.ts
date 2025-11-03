import {
  ObjectType,
  Field,
  ID,
  Int,
  Float,
  registerEnumType,
} from '@nestjs/graphql';
import { MissionType, MissionDifficulty } from '@prisma/client';

registerEnumType(MissionType, { name: 'MissionType' });
registerEnumType(MissionDifficulty, { name: 'MissionDifficulty' });

@ObjectType()
export class Mission {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => MissionType)
  type: MissionType;

  @Field(() => MissionDifficulty)
  difficulty: MissionDifficulty;

  @Field()
  icon: string;

  @Field()
  targetType: string;

  @Field(() => Int)
  targetValue: number;

  @Field(() => String, { nullable: true })
  gameId?: string;

  @Field(() => Int)
  xpReward: number;

  @Field(() => Float)
  coinsReward: number;

  @Field()
  active: boolean;

  @Field(() => Int)
  order: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class UserMissionProgress {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  missionId: string;

  @Field(() => Int)
  currentProgress: number;

  @Field()
  completed: boolean;

  @Field()
  claimedReward: boolean;

  @Field(() => Date, { nullable: true })
  resetAt?: Date;

  @Field(() => Date, { nullable: true })
  completedAt?: Date;

  @Field(() => Date, { nullable: true })
  claimedAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class UserMission extends Mission {
  @Field(() => UserMissionProgress, { nullable: true })
  userProgress?: UserMissionProgress;
}
