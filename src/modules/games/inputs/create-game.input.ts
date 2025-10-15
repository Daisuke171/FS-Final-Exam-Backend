import { InputType, Field, Int } from '@nestjs/graphql';
import { IsNotEmpty, Min, Max } from 'class-validator';

@InputType()
export class CreateGameInput {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsNotEmpty()
  description: string;

  @Field()
  @IsNotEmpty()
  rules: string;

  @Field()
  @IsNotEmpty()
  gameLogo: string;

  @Field()
  @IsNotEmpty()
  category: string;

  @Field(() => Int)
  @Min(0)
  score: number;

  @Field()
  duration: string;

  @Field(() => Int)
  @Min(1)
  @Max(10)
  maxPlayers: number;

  @Field(() => Int)
  @Min(1)
  minPlayers: number;
}
