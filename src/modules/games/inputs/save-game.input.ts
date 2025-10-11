import { InputType, Field, Int, ID } from '@nestjs/graphql';
import { IsNotEmpty, Min, IsIn } from 'class-validator';

@InputType()
export class SaveGameResultInput {
  @Field(() => ID)
  @IsNotEmpty()
  userId: string;

  @Field(() => ID)
  @IsNotEmpty()
  gameId: string;

  @Field(() => Int)
  @Min(0)
  duration: number;

  @Field()
  @IsIn(['won', 'lost', 'draw'])
  state: string;

  @Field(() => Int)
  @Min(0)
  score: number;

  @Field(() => Int)
  @Min(0)
  totalDamage: number;
}
