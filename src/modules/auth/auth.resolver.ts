import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginInput } from './inputs/login.input';
import { AuthResponse } from './responses/auth.response';
import { UserGraph } from '@modules/user/models/user.model';
import { RegisterInput } from './inputs/register.input';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, Inject, UseGuards } from '@nestjs/common';
import { RefreshResponse } from './responses/refresh.response';
import { CurrentUser } from './decorators/current-user.decorator';
import { GqlAuthGuard } from './guards/gql-auth.guard';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    @Inject('JWT_REFRESH_SERVICE')
    private readonly refreshJwtService: JwtService,
  ) {}

  @Mutation(() => UserGraph)
  async register(
    @Args('registerInput') registerInput: RegisterInput,
  ): Promise<UserGraph> {
    return this.authService.register(registerInput);
  }

  @Mutation(() => AuthResponse)
  login(@Args('loginInput') loginInput: LoginInput): Promise<AuthResponse> {
    return this.authService.login(loginInput);
  }

  @Mutation(() => RefreshResponse)
  async refreshToken(@Args('token') token: string): Promise<RefreshResponse> {
    try {
      const payload = await this.refreshJwtService.verify(token);
      const accessToken = this.jwtService.sign({ sub: payload.sub });
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  @Query(() => UserGraph)
  @UseGuards(GqlAuthGuard)
  me(@CurrentUser() user: UserGraph) {
    return user;
  }
}
