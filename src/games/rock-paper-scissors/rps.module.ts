import { Module } from '@nestjs/common';
import { RpsGateway } from './gateway/rps.gateway';
import { RpsService } from './rps.service';

@Module({
  providers: [RpsGateway, RpsService],
})
export class RpsModule {}
