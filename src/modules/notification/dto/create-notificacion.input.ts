import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsString } from 'class-validator';
@InputType()
export class CreateNotificationInput {
  @Field()
  @IsString()
  type!: string;

  @Field()
  @IsString()
  entity!: string;

  @Field(() => ID)
  @IsUUID()
  userId!: string;
}