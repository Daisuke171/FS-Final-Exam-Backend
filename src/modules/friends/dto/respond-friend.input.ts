import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class RespondFriendInput {
  @Field(() => ID) requestId!: string;      // id del Friend (solicitud)
  @Field() accept!: boolean;               // true = aceptar, false = rechazar
}