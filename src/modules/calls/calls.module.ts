import { Module } from '@nestjs/common';
import { CallsResolver } from './calls.resolver';
import { CallsService } from './calls.service';
import { PrismaModule } from 'prisma/prisma.module';
import { CallGateway } from './calls.gateway';

@Module({
  imports: [PrismaModule],
  providers: [CallGateway],
  exports: [CallGateway],
})
export class CallModule {}