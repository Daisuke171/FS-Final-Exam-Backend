import { InputType, Field } from '@nestjs/graphql';
import {
  IsDateString,
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { MinAge } from 'src/modules/auth/decorators/min-age.decorator';

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @Field()
  @IsString()
  @MinLength(6)
  @MaxLength(10)
  @Matches(/^(?!.*__)[a-zA-Z0-9_]+$/, {
    message: 'Solo letras, números y se permite un solo guion bajo',
  })
  username: string;

  @Field()
  @IsString()
  @MinLength(6)
  @MaxLength(10)
  @Matches(/^(?!.*__)[a-zA-Z0-9_]+$/, {
    message: 'Solo letras, números y se permite un solo guion bajo',
  })
  nickname: string;

  @Field()
  @IsString()
  @MinLength(6)
  @MaxLength(16)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message:
      'La contraseña debe incluir mayúscula, minúscula, número y caracter especial',
  })
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
  @MinAge(7, { message: 'Debes tener al menos 7 años para registrarte' })
  birthday: string;
}
