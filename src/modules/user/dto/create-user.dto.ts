import { IsString, IsEmail, IsDateString, Matches } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsString()
  lastname: string;

  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @Matches(/^(?=.*[A-Z])(?=.*[\W_]).{6,}$/, {
    message:
      'La contraseña debe contener minimo 6 caracteres, una letra mayúscula, y un simbolo',
  })
  password: string;

  @IsDateString()
  birthday: Date;
}
