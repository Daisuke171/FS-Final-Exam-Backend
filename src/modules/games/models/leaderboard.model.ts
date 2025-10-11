import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class LeaderboardEntry {
  @Field(() => Int)
  rank: number;

  @Field(() => ID)
  userId: string;

  @Field()
  nickname: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => Int)
  totalScore: number;

  @Field(() => Int)
  bestScore: number;

  @Field(() => Int)
  totalGames: number;

  @Field(() => Int)
  wins: number;
}

@ObjectType()
export class Leaderboard {
  @Field(() => ID)
  gameId: string;

  @Field()
  gameName: string;

  @Field(() => [LeaderboardEntry])
  entries: LeaderboardEntry[];

  @Field()
  generatedAt: Date;
}
