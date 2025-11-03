import { InputType, Field, Int } from '@nestjs/graphql';
import { Min, IsIn, IsString } from 'class-validator';

@InputType()
export class SaveGameResultInput {
  @Field()
  @IsString()
  gameName: string;

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
