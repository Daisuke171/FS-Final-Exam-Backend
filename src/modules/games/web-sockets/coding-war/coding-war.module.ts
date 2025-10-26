import { Module } from '@nestjs/common';
import { CWService } from './coding-war.service';
import { GamesModule } from '../../games.module';
import { CWGateway } from './gateway/coding-war.gateway';
import { UserModule } from '@modules/user/user.module';
import { AuthModule } from '@modules/auth/auth.module';

@Module({
  providers: [CWGateway, CWService],
  imports: [GamesModule, UserModule, AuthModule],
})
export class CodingWarModule {}
