import { Module } from '@nestjs/common';
import { RpsGateway } from './gateway/rps.gateway';
import { RpsService } from './rps.service';
import { GamesModule } from '@modules/games/games.module';
import { UserModule } from '@modules/user/user.module';

@Module({
  providers: [RpsGateway, RpsService],
  imports: [GamesModule, UserModule],
})
export class RpsModule {}
