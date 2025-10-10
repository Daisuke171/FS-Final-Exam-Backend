import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
//sercivio que inicializa y gestiona la conexion entre NestJS y Prisma(base de datos)
//se activa automaticamente al iniciar el servidor por OnModuleInit que ejecuta el connect para establecer conexion con la base de datos
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
