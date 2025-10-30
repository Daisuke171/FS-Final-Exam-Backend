import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginInput } from './inputs/login.input';
import { AuthResponse } from './responses/auth.response';
import { UserGraph } from '@modules/user/models/user.model';
import { RegisterInput } from './inputs/register.input';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import { RefreshResponse } from './responses/refresh.response';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '@modules/auth/guards/gql-auth.guard';
import { Context } from '@nestjs/graphql';
import { GoogleAuthInput } from './inputs/google-auth.input';

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
  async googleAuth(
    @Args('googleAuthInput') googleAuthInput: GoogleAuthInput,
  ): Promise<AuthResponse> {
    return this.authService.googleAuth(googleAuthInput);
  }

  @Mutation(() => AuthResponse)
  login(@Args('loginInput') loginInput: LoginInput): Promise<AuthResponse> {
    return this.authService.login(loginInput);
  }

  @Mutation(() => RefreshResponse)
  async rotateRefreshToken(@Args('RefreshOldToken') oldToken: string) {
    console.log('🔁 Recibiendo solicitud de rotación de token...');
    console.log('🧾 Old token:', oldToken);
    const newToken = await this.authService.rotateRefreshToken(oldToken);
    console.log('✅ Nuevo refresh token emitido:', newToken);
    return { refreshToken: newToken };
  }

  @Mutation(() => AuthResponse)
  async refreshAccessToken(@Args('refreshToken') refreshToken: string) {
    console.log('🔑 Refrescando access token...');
    console.log('📩 Refresh token recibido:', refreshToken);
    return this.authService.refreshAccessToken(refreshToken);
  }

  // auth.resolver.ts
  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async logout(@Context() ctx) {
    const userId = ctx.req.user.id;

    if (!userId) {
      console.error(
        '[Auth] Error: No se encontró userId en el contexto de la request.',
      );
      throw new Error('Usuario no autenticado correctamente.');
    }

    try {
      await this.authService.revokeAllRefreshTokens(userId);

      console.log(
        `[Auth] Tokens revocados exitosamente para userId: ${userId}`,
      );
      return true;
    } catch (error) {
      console.error(
        `[Auth] Fallo al revocar tokens para userId: ${userId}`,
        error,
      );

      throw new Error(
        `Error al cerrar sesión: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
