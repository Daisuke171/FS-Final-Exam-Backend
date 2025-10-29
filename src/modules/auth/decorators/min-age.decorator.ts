import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function MinAge(minAge: number, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'MinAge',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [minAge],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return false;
          const birthday = new Date(value);
          const today = new Date();

          let age = today.getFullYear() - birthday.getFullYear();
          const m = today.getMonth() - birthday.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
            age--;
          }

          return age >= args.constraints[0];
        },
        defaultMessage(args: ValidationArguments) {
          return `La edad mínima es de ${args.constraints[0]} años`;
        },
      },
    });
  };
}
