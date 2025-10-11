import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class AppResolver {
  // 💡 Necesitas al menos una Query. Esta es la más simple.
  @Query(() => Boolean)
  healthCheck(): boolean {
    return true;
  }
}
