import { InputType, Field } from '@nestjs/graphql';
import {
  IsDateString,
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @MinLength(6)
  @MaxLength(10)
  username: string;

  @Field()
  @IsString()
  @MinLength(6)
  @MaxLength(10)
  nickname: string;

  @Field()
  @IsString()
  @MinLength(6)
  @MaxLength(16)
  password: string;

  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(16)
  name: string;

  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  lastname: string;

  @Field()
  @IsDateString()
  birthday: string;
}
