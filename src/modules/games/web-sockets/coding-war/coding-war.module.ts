import { Module } from '@nestjs/common';
import { CWService } from './coding-war.service';
import { GamesModule } from '../../games.module';
import { CWGateway } from './gateway/coding-war.gateway';

@Module({
  providers: [CWGateway, CWService],
  imports: [GamesModule],
})
export class CodingWarModule {}
