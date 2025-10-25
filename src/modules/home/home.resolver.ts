import { Resolver, Query, Context } from '@nestjs/graphql';
import { HomeService } from './home.service';
import { DashboardOutput } from './dto/dashboard.output';

@Resolver()
export class HomeResolver {
  constructor(private readonly homeService: HomeService) {}

  @Query(() => DashboardOutput, { name: 'getHomeDashboard' })
  async getHomeDashboard(@Context() context: any): Promise<DashboardOutput> {
    // ⚠️ REEMPLAZAR con la lógica real de autenticación (ej. context.req.user.id)
    const userId = 'ID_DEL_USUARIO_AUTENTICADO'; 

    return this.homeService.getDashboardData(userId);
  }
}