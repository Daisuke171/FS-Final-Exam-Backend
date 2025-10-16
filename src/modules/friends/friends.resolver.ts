import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { FriendsService } from './friends.service';
import { Friend } from './models/friend.model';
import {
  RequestFriendByUsernameInput,
  CreateFriendInviteInput,
  AcceptFriendInviteInput,
  UpdateFriendStatusInput,
  ToggleFriendActiveInput,
} from './dto';

@Resolver(() => Friend)
export class FriendsResolver {
  constructor(private readonly friends: FriendsService) {}

  // Queries
  @Query(() => [Friend])
  myFriends(@Args('userId', { type: () => ID }) userId: string) {
    return this.friends.listForUser(userId);
  }

  // Mutations
  @Mutation(() => Friend)
  requestFriendByUsername(@Args('input') input: RequestFriendByUsernameInput) {
    return this.friends.requestByUsername(input);
  }

  @Mutation(() => String)
  createFriendInvite(@Args('input') input: CreateFriendInviteInput) {
    console.log('Input recibido:', input);
    return this.friends.createInvite(input);
  }

  @Mutation(() => Friend)
  acceptFriendInvite(@Args('input', { type: () => AcceptFriendInviteInput }) input: AcceptFriendInviteInput) {
    console.log('acceptFriendInvite input =>', input);

    return this.friends.acceptInvite(input);
  }

  @Mutation(() => Friend)
  updateFriendStatus(@Args('input') input: UpdateFriendStatusInput) {
    return this.friends.updateStatus(input);
  }

  @Mutation(() => Friend)
  toggleFriendActive(@Args('input') input: ToggleFriendActiveInput) {
    return this.friends.toggleActive(input);
  }

  @Mutation(() => Boolean)
  removeFriend(@Args('id', { type: () => ID }) id: string) {
    return this.friends.remove(id);
  }
}
