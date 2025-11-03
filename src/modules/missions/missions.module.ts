import { Module } from '@nestjs/common';
import { MissionsResolver } from './missions.resolver';
import { MissionsService } from './missions.service';
import { UserModule } from '@modules/user/user.module';

@Module({
  providers: [MissionsResolver, MissionsService],
  exports: [MissionsService],
  imports: [UserModule],
})
export class MissionsModule {}
