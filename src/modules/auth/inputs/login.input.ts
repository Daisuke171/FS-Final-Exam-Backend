import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, MaxLength, MinLength, Matches } from 'class-validator';

@InputType()
export class LoginInput {
  @Field()
  @IsNotEmpty()
  usernameOrEmail: string; //puede ser email o username

  @Field()
  @IsNotEmpty()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(16, { message: 'La contraseña no puede tener mas de 16 caracteres' })
  @Matches(/^\S+$/, { message: 'La contraseña no puede tener espacios' })
  password: string;
}
