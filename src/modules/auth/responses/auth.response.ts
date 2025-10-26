import { Field, ObjectType } from '@nestjs/graphql';
import { UserGraph } from 'src/modules/user/models/user.model';

@ObjectType()
export class AuthResponse {
  @Field()
  accessToken!: string;

  @Field()
  refreshToken: string;

  @Field(() => UserGraph)
  user!: UserGraph;
}
