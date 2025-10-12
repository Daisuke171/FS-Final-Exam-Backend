import { Global, Module } from '@nestjs/common';
import { ObservableService } from './observable.service';
import { PrismaService } from 'prisma/prisma.service';

@Global()
@Module({
  providers: [ObservableService, PrismaService],
  exports: [ObservableService, PrismaService],
})
export class CommonModule {}