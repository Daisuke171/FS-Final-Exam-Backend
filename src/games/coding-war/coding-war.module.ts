import { Module } from '@nestjs/common';
import { CodingWarController } from './coding-war.controller';
import { CodingWarService } from './coding-war.service';
import { CodingWarGateway } from './coding-war.gateway';

@Module({
  controllers: [CodingWarController],
  providers: [CodingWarService, CodingWarGateway],
  exports: [CodingWarService],
})
export class CodingWarModule {}
