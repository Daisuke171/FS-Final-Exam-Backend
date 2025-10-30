import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

@InputType()
export class GoogleAuthInput {
  @Field()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @Field()
  @IsString()
  name: string;

  @Field()
  @IsString()
  googleId: string;
}
