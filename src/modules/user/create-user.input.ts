import {
  IsString,
  IsEmail,
  IsDateString,
  Matches,
  IsOptional,
} from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateUserInput {
  @Field()
  @IsString()
  name: string;

  @Field()
  @IsString()
  lastname: string;

  @Field()
  @IsString()
  username: string;

  @Field()
  @IsEmail()
  email: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  nickname?: string;

  @Field()
  @Matches(/^(?=.*[A-Z])(?=.*[\W_]).{6,}$/, {
    message:
      'La contraseña debe contener mínimo 6 caracteres, una letra mayúscula, y un símbolo',
  })
  password: string;

  @Field()
  @IsDateString()
  birthday: Date;
}
