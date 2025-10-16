import { Module } from '@nestjs/common';
import { RpsGateway } from './gateway/rps.gateway';
import { RpsService } from './rps.service';
import { GamesModule } from '@modules/games/games.module';

@Module({
  providers: [RpsGateway, RpsService],
  imports: [GamesModule],
})
export class RpsModule {}
