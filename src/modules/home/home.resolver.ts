import { Resolver, Query, Context } from '@nestjs/graphql';
import { HomeService } from './home.service';
import { DashboardOutput } from './dto/dashboard.output';

@Resolver()
export class HomeResolver {
  constructor(private readonly homeService: HomeService) {}

  @Query(() => DashboardOutput, { name: 'getHomeDashboard' })
  async getHomeDashboard(@Context() context: any): Promise<DashboardOutput> {
    // ⚠️ Usar un ID de prueba hasta que se implemente la seguridad
    const userId = 'ID_DEL_USUARIO_AUTENTICADO'; 

    return this.homeService.getDashboardData(userId);
  }
}