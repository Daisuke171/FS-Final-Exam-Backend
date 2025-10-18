import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveField,
  Int,
  Parent,
  Float,
} from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './models/user.model';
import { CreateUserInput } from './create-user.input';
import { PrismaService } from 'prisma/prisma.service';
import { SkinWithStatus } from './models/skin-with-status.model';
// import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { UserSkin } from '@modules/user-skins/models/user-skin.model';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
  ) {}

  // === QUERIES ===
  @Query(() => [User], { name: 'users' })
  findAll() {
    return this.userService.findAll();
  }

  @Query(() => User)
  async me(@Args('userId', { type: () => ID }) userId: string) {
    return this.userService.getMe(userId);
  }

  @Query(() => [SkinWithStatus])
  async userSkinsWithStatus(
    @Args('userId', { type: () => ID }) userId: string,
  ) {
    return this.userService.getUserSkinsWithStatus(userId);
  }

  // @Query(() => [SkinWithStatus])
  // async userSkinsWithStatus(@CurrentUser() user: User) {
  //   return this.userService.getUserSkinsWithStatus(user.id);
  // }

  // === RESOLVER FIELDS ===

  @ResolveField(() => Int, { nullable: true })
  async nextLevelExperience(@Parent() user: User): Promise<number | null> {
    // Obtener el siguiente nivel
    const nextLevel = await this.prisma.level.findFirst({
      where: {
        atomicNumber: user.level.atomicNumber + 1, // Siguiente nivel
      },
    });

    return nextLevel?.experienceRequired || null;
  }

  // Progreso hacia el siguiente nivel (porcentaje)
  @ResolveField(() => Float)
  async levelProgress(@Parent() user: User): Promise<number> {
    const nextLevel = await this.prisma.level.findFirst({
      where: {
        atomicNumber: user.level.atomicNumber + 1,
      },
    });

    if (!nextLevel) return 100; // Ya está en el nivel máximo

    const currentLevelExp = user.level.experienceRequired;
    const nextLevelExp = nextLevel.experienceRequired;
    const experienceInCurrentLevel = user.experience - currentLevelExp;
    const experienceNeededForNextLevel = nextLevelExp - currentLevelExp;

    return (experienceInCurrentLevel / experienceNeededForNextLevel) * 100;
  }

  // Experiencia que falta para el siguiente nivel
  @ResolveField(() => Int)
  async experienceToNextLevel(@Parent() user: User): Promise<number> {
    const nextLevel = await this.prisma.level.findFirst({
      where: {
        atomicNumber: user.level.atomicNumber + 1,
      },
    });

    if (!nextLevel) return 0; // Ya está en el nivel máximo

    return Math.max(0, nextLevel.experienceRequired - user.experience);
  }

  @ResolveField(() => Int)
  async totalScore(@Parent() user: User): Promise<number> {
    const result = await this.prisma.gameHistory.aggregate({
      where: {
        userId: user.id,
      },
      _sum: {
        score: true,
      },
    });

    return result._sum.score || 0;
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

  @Mutation(() => UserSkin)
  async activateSkin(
    @Args('skinId', { type: () => ID }) skinId: string,
    @Args('userId', { type: () => ID }) userId: string,
  ) {
    const result = await this.userService.activateSkin(userId, skinId);
    return result[1]; // Retorna el skin activado de la transacción
  }

  // @Mutation(() => UserSkin)
  // async activateSkin(
  //   @Args('skinId', { type: () => ID }) skinId: string,
  //   @CurrentUser() user: User,
  // ) {
  //   const result = await this.userService.activateSkin(user.id, skinId);
  //   return result[1]; // Retorna el skin activado de la transacción
  // }
}
