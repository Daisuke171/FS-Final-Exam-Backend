import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsResolver } from './friends.resolver';
import { FriendsGateway } from './friends.gateway';

@Module({
  providers: [FriendsService, FriendsResolver, FriendsGateway],
  exports: [FriendsService],
})
export class FriendsModule {}
