import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class UserStats {
  @Field(() => Float)
  winRate: number;

  @Field()
  totalTime: string;

  @Field(() => Int)
  highScore: number;

  @Field(() => Int)
  bestStreak: number;

  @Field(() => Float)
  avgPerDay: number;

  @Field(() => Int)
  totalGames: number;

  @Field(() => Int)
  totalWins: number;

  @Field(() => Int)
  totalLosses: number;

  @Field(() => Int)
  totalDraws: number;

  @Field(() => Int)
  averageScore: number;
}
