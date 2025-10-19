import { Field, ObjectType } from '@nestjs/graphql';
import { UserInfo } from 'os';
import { UserGraph } from 'src/modules/user/models/user.model';

@ObjectType()
export class AuthResponse {
  @Field()
  accessToken!: string;

  @Field(() => UserGraph)
  user!: UserGraph;
}
