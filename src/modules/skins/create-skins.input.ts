import { InputType, Field, Float, Int } from '@nestjs/graphql';
import { IsString, IsInt, Min, IsDefined, IsOptional } from 'class-validator';

@InputType()
export class CreateSkinInput {
  @Field()
  @IsString()
  @IsDefined()
  name: string;

  @Field()
  @IsString()
  @IsDefined()
  img: string;

  @Field(() => Int)
  @Min(0)
  @IsInt()
  @IsDefined()
  level: number;

  @Field(() => String)
  @IsString()
  category!: string;

  @Field(() => Float)
  @Min(0)
  @IsInt()
  @IsDefined()
  value: number;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  userIds?: string[];
}
