import { Module } from '@nestjs/common';
import { TDService } from './turing-detective.service';
import { GamesModule } from '../../games.module';
import { TDGateway } from './gateway/turing-detective.gateway';
import { UserModule } from '@modules/user/user.module';
import { AuthModule } from '@modules/auth/auth.module';

@Module({
  providers: [TDGateway, TDService],
  imports: [GamesModule, UserModule, AuthModule],
})
export class TuringDetectiveModule {}
