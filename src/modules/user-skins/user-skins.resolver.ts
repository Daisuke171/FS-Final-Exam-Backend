import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UserSkinService } from './user-skins.service';
import { UserSkin } from './models/user-skin.model';
import { CreateUserSkinInput } from './create-user-skin.input';

@Resolver(() => UserSkin)
export class UserSkinResolver {
  constructor(private readonly userSkinService: UserSkinService) {}

  @Query(() => [UserSkin])
  userSkins() {
    return this.userSkinService.findAll();
  }

  @Mutation(() => UserSkin)
  assignSkin(@Args('data') data: CreateUserSkinInput) {
    return this.userSkinService.assignSkin(data);
  }
}
