import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

@InputType()
export class RespondFriendInput {
  @Field(() => ID)
  @IsUUID()
  requestId!: string;      // id del Friend (solicitud)

  @Field()
  @IsBoolean()
  accept!: boolean;               // true = aceptar, false = rechazar
}