import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsInt, Min } from 'class-validator';

@InputType()
export class CreateLevelInput {
  @Field(() => Int)
  @IsInt()
  number: number;

  @Field()
  @IsString()
  name: string;

  @Field()
  @IsString()
  color: string;

  @Field(() => Int)
  @Min(0)
  experienceRequired: number;
}
