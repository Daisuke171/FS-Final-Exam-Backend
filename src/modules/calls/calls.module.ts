import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { CallGateway } from './calls.gateway';

@Module({
  imports: [PrismaModule],
  providers: [CallGateway],
  exports: [CallGateway],
})
export class CallModule {}