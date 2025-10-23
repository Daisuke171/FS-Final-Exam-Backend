import { InternalServerErrorException } from '@nestjs/common';

export function getEnvNumber(key: string): number {
  const raw = process.env[key]?.trim();
  const value = Number(raw);

  if (!value || isNaN(value)) {
    throw new InternalServerErrorException(
    `configuracion invalida: la variable: ${key} debe ser un numero`,
    );
  }

  return value;
}
