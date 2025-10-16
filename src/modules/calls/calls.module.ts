import { Module } from '@nestjs/common';
import { CallsResolver } from './calls.resolver';
import { CallsService } from './calls.service';
import { PrismaService } from 'prisma/prisma.service';
import { ObservableService } from '@common/observable.service';
import { PubSub } from 'graphql-subscriptions';

@Module({
  providers: [
    CallsResolver,
    CallsService,
    PrismaService,
    ObservableService,
    { provide: 'PUB_SUB', useValue: new PubSub() },
  ],
})
export class CallsModule {}
