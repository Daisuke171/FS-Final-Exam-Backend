import { Module } from '@nestjs/common';
import { GameGateway } from './gateway/rps.gateway';
import { GameService } from './game.service';

@Module({
  providers: [GameGateway, GameService],
})
export class GameModule {}
