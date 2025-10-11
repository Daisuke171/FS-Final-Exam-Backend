import { Field, ObjectType } from '@nestjs/graphql';
import { User } from 'src/modules/user/models/user.model';

@ObjectType()
export class AuthResponse {
  @Field()
  accessToken: string;

  @Field(() => User)
  user: User;
}
