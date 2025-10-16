import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
@InputType()
export class CreateFriendInput {
  @Field(() => ID)
  @IsUUID()
  userId!: string;         // dueño del registro

  @Field({ defaultValue: 'pending' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  status?: string;

  @Field({ defaultValue: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}