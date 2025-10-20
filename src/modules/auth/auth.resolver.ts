import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginInput } from './inputs/login.input';
import { AuthResponse } from './responses/auth.response';
import { UserGraph } from '@modules/user/models/user.model';
import { RegisterInput } from './inputs/register.input';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

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
}
