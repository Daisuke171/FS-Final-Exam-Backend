import { Module } from '@nestjs/common';
import { CodingWarController } from './coding-war.controller';
import { CodingWarService } from './coding-war.service';

@Module({
  controllers: [CodingWarController],
  providers: [CodingWarService],
})
export class CodingWarModule {}
