import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { SkinsService } from './skins.service';
import { Skin } from './models/skins.model';
import { CreateSkinInput } from './create-skins.input';

@Resolver(() => Skin)
export class SkinResolver {
  constructor(private readonly skinService: SkinsService) {}

  // 🟢 Query: Get all skins
  @Query(() => [Skin], { name: 'skins' })
  findAll() {
    return this.skinService.findAll();
  }

  // 🟢 Query: Get a single skin by ID
  @Query(() => Skin, { name: 'skin' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.skinService.findOne(id);
  }

  // 🟢 Mutation: Create a new skin
  @Mutation(() => Skin)
  createSkin(@Args('data') data: CreateSkinInput) {
    return this.skinService.create(data);
  }

  // 🔴 Mutation: Delete a skin
  @Mutation(() => Skin)
  deleteSkin(@Args('id', { type: () => ID }) id: string) {
    return this.skinService.delete(id);
  }
}
