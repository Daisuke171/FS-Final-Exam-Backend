import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { LevelService } from './level.service';
import { Level, CreateManyResult } from './models/level.model';
import { CreateLevelInput } from './create-level.input';
@Resolver(() => Level)
export class LevelResolver {
  constructor(private readonly levelService: LevelService) {}

  // Queries
  @Query(() => [Level], { name: 'levels' })
  findAll() {
    return this.levelService.findAll();
  }

  @Query(() => Level, { name: 'level' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.levelService.findOne(id);
  }

  // Mutations
  @Mutation(() => Level)
  createLevel(@Args('data') data: CreateLevelInput) {
    return this.levelService.createMany([data]);
  }

  @Mutation(() => CreateManyResult, { name: 'createManyLevels' })
  async createManyLevels(
    @Args('data', { type: () => [CreateLevelInput] }) data: CreateLevelInput[],
  ): Promise<CreateManyResult> {
    const count = await this.levelService.createMany(data);
    return { count };
  }

  @Mutation(() => Level)
  deleteLevel(@Args('id', { type: () => Int }) id: number) {
    return this.levelService.delete(id);
  }
}
