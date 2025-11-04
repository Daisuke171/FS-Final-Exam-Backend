import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { AchievementRarity, AchievementCategory } from '@prisma/client';

registerEnumType(AchievementRarity, { name: 'AchievementRarity' });
registerEnumType(AchievementCategory, { name: 'AchievementCategory' });

@ObjectType()
export class Achievement {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => AchievementRarity)
  rarity: AchievementRarity;

  @Field(() => AchievementCategory)
  category: AchievementCategory;

  @Field()
  icon: string;

  @Field()
  targetType: string;

  @Field(() => Int)
  targetValue: number;

  @Field(() => String, { nullable: true })
  gameId?: string;

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
export class UserAchievement {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  achievementId: string;

  @Field(() => Int)
  currentProgress: number;

  @Field(() => Date, { nullable: true })
  unlockedAt?: Date;

  @Field()
  seen: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class UserAchievementResponse extends Achievement {
  @Field(() => UserAchievement, { nullable: true })
  userAchievement?: UserAchievement;
}

@ObjectType()
export class UnseenAchievementResponse {
  @Field(() => Achievement)
  achievement: Achievement;

  @Field(() => UserAchievement)
  userAchievement: UserAchievement;
}

@ObjectType()
export class AchievementStatsResponse {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  unlocked: number;

  @Field(() => Int)
  locked: number;

  @Field(() => Int)
  percentage: number;
}
