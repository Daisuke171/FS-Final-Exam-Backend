import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class RefreshResponse {
  @Field()
  refreshToken: string;
}
