import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginInput } from './inputs/login.input';
import { AuthResponse } from './responses/auth.response';
import { UserGraph } from '@modules/user/models/user.model';
import { RegisterInput } from './inputs/register.input';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, Inject } from '@nestjs/common';
import { RefreshResponse } from './responses/refresh.response';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '@modules/auth/guards/gql-auth.guard';
import { Context } from '@nestjs/graphql';

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
  async rotateRefreshToken(@Args('RefreshOldToken') oldToken: string) {
    const newToken = await this.authService.rotateRefreshToken(oldToken);
    return { refreshToken: newToken };
  }

  @Mutation(() => AuthResponse)
  async refreshAccessToken(@Args('refreshToken') refreshToken: string) {
    return this.authService.refreshAccessToken(refreshToken);
  }

  // auth.resolver.ts
  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async logout(@Context() ctx) {
    const userId = ctx.req.user.id;
    await this.authService.revokeAllRefreshTokens(userId);
    return true;
  }
}
