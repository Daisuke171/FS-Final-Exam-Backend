import { Resolver, Query, Mutation, Args, ID, Subscription } from '@nestjs/graphql';
import { Inject, UseGuards } from '@nestjs/common';
import { PubSub, PubSubEngine } from 'graphql-subscriptions';
import { CallsService } from './calls.service';
import { Call } from './models/call.model';
import { StartCallInput } from './dto/start-call.input';
import { AnswerCallInput } from './dto/answer-call.input';
import { RejectCallInput } from './dto/reject-call.input';
import { EndCallInput } from './dto/end-call.input';
import { IceCandidateInput } from './dto/ice-candidate.input';
import { GqlAuthGuard } from '@modules/auth/guards/gql-auth.guard';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { User } from '@modules/user/models/user.model';


const pubSub = new PubSub();
@UseGuards(GqlAuthGuard)
@Resolver(() => Call)
export class CallsResolver {
  constructor(
    private readonly calls: CallsService
  ) {}

  // 🔸 Queries
  @Query(() => [Call])
  myActiveCalls(@CurrentUser() user: User) {
    return this.calls.getActiveCallsByUser(user.id);
  }

  // 🔸 Mutations
  @Mutation(() => Call)
  async startCall(@CurrentUser() user: User, @Args('calleeId', { type: () => ID }) calleeId: string, @Args('sdpOffer') sdpOffer: string) {
    const call = await this.calls.startCall({ callerId: user.id, calleeId, sdpOffer });
    await pubSub.publish(`call:ringing:${calleeId}`, { callRinging: call });
    return call;
  }

  @Mutation(() => Call)
  async answerCall(@CurrentUser() user: User, @Args('input') input: AnswerCallInput) {
    const call = await this.calls.answerCall({ ...input, calleeId: user.id });
    await pubSub.publish(`call:accepted:${call.id}`, { callAccepted: call });
    return call;
  }

  @Mutation(() => Call)
  async rejectCall(@CurrentUser() user: User, @Args('callId', { type: () => ID }) callId: string) {
    const call = await this.calls.rejectCall({ callId, calleeId: user.id });
    await pubSub.publish(`call:rejected:${call.id}`, { callRejected: call });
    return call;
  }

  @Mutation(() => Call)
  async endCall(@CurrentUser() user: User, @Args('callId', { type: () => ID }) callId: string) {
    const call = await this.calls.endCall({ callId, userId: user.id });
    await pubSub.publish(`call:ended:${call.id}`, { callEnded: call });
    return call;
  }

  // 🔸 Subscriptions
  @Subscription(() => Call, {
    filter: (payload, variables) => payload.callRinging.calleeId === variables.calleeId,
    resolve: (payload) => payload.callRinging,
  })
  callRinging(@Args('calleeId', { type: () => ID }) calleeId: string) {
    return pubSub.asyncIterator(`call:ringing:${calleeId}`);
  }
}
