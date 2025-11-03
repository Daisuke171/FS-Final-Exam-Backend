import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { MissionType, MissionDifficulty } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

@InputType()
export class CreateMissionInput {
  @Field()
  @IsString()
  title: string;

  @Field()
  @IsString()
  description: string;

  @Field(() => MissionType)
  @IsEnum(MissionType)
  type: MissionType;

  @Field(() => MissionDifficulty)
  @IsEnum(MissionDifficulty)
  difficulty: MissionDifficulty;

  @Field()
  @IsString()
  icon: string;

  @Field()
  @IsString()
  targetType: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  targetValue: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  gameId?: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  xpReward: number;

  @Field(() => Float, { defaultValue: 0 })
  @IsNumber()
  @Min(0)
  coinsReward: number;

  @Field(() => Int, { defaultValue: 0 })
  @IsInt()
  @Min(0)
  order: number;
}
