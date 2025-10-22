import { Module } from '@nestjs/common';
import { RpsGateway } from './gateway/rps.gateway';
import { RpsService } from './rps.service';
import { GamesModule } from '@modules/games/games.module';
import { UserModule } from '@modules/user/user.module';
import { AuthModule } from '@modules/auth/auth.module';

@Module({
  providers: [RpsGateway, RpsService],
  imports: [GamesModule, UserModule, AuthModule],
})
export class RpsModule {}
