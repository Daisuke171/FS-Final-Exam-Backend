import { Module } from '@nestjs/common';
import { TestGateway } from './gateway/test.gateway';
import { TestService } from './test.service';
import { GamesModule } from '../../games.module';

@Module({
  providers: [TestGateway, TestService],
  imports: [GamesModule],
})
export class TestModule {}
