import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';
import { IsUUID, IsString} from 'class-validator';

@ObjectType()
export class Notification {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field()
  @IsString()
  type!: string;

  @Field()
  @IsString()
  entity!: string;

  @Field(() => ID)
  @IsUUID()
  userId!: string;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}
  
