import { Module } from '@nestjs/common';
import { SkinsService } from './skins.service';

@Module({
  providers: [SkinsService]
})
export class SkinsModule {}
