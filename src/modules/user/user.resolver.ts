import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './user.model';
import { CreateUserInput } from './create-user.input';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  // === QUERIES ===
  @Query(() => [User], { name: 'users' })
  findAll() {
    return this.userService.findAll();
  }

  // === MUTATIONS ===
  @Mutation(() => User)
  createUser(@Args('data') data: CreateUserInput) {
    return this.userService.create(data);
  }

  @Mutation(() => User)
  deleteUser(@Args('id', { type: () => ID }) id: string) {
    return this.userService.delete(id);
  }
}
