import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType()
export class GameSummary {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  gameLogo: string;
}

@ObjectType()
export class NotificationSummary {
  @Field(() => Number)
  unreadCount: number;
}

@ObjectType()
export class MessageSummary {
  @Field(() => Number)
  unreadCount: number;
}

@ObjectType()
export class DashboardOutput {
  @Field(() => [GameSummary], { description: 'Lista de juegos o misiones disponibles' })
  games: GameSummary[];

  @Field(() => NotificationSummary, { description: 'Conteo de notificaciones no leídas' })
  notifications: NotificationSummary;

  @Field(() => MessageSummary, { description: 'Conteo de mensajes de chat no leídos' })
  messages: MessageSummary;
}