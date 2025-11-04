import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CallsService } from './calls.service';
import { Call } from './models/call.model';
import { GqlAuthGuard } from '@modules/auth/guards/gql-auth.guard';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { UserGraph } from '@modules/user/models/user.model';

@UseGuards(GqlAuthGuard)
@Resolver(() => Call)
export class CallsResolver {
  constructor(
    private readonly calls: CallsService
  ) { }



  @Query(() => [Call])
  myActiveCalls(@CurrentUser() user: UserGraph) {
    return this.calls.getActiveCallsByUser(user.id);
  }


  @Mutation(() => Call)
  startCall(@CurrentUser() user: UserGraph, @Args('calleeId', { type: () => ID }) calleeId: string, @Args('sdpOffer') sdpOffer: string) {
    return this.calls.startCall({ callerId: user.id, calleeId, sdpOffer });
  }


  @Mutation(() => Call)
  answerCall(@CurrentUser() user: UserGraph, @Args('callId', { type: () => ID }) callId: string, @Args('sdpAnswer') sdpAnswer: string) {
    return this.calls.answerCall({ callId, calleeId: user.id, sdpAnswer });
  }


  @Mutation(() => Call)
  rejectCall(@CurrentUser() user: UserGraph, @Args('callId', { type: () => ID }) callId: string) {
    return this.calls.rejectCall({ callId, calleeId: user.id });
  }


  @Mutation(() => Call)
  endCall(@CurrentUser() user: UserGraph, @Args('callId', { type: () => ID }) callId: string) {
    return this.calls.endCall({ callId, userId: user.id });
  }

}
