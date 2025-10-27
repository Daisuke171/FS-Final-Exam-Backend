import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType()
export class GameSummary {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  gameLogo: string;

  @Field(() => Boolean)
  isFavorite: boolean; 
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
  @Field(() => [GameSummary], { description: 'Lista de juegos activos y próximos' })
  games: GameSummary[];

  @Field(() => NotificationSummary, { description: 'Conteo total de notificaciones no leídas' })
  notifications: NotificationSummary;

  @Field(() => MessageSummary, { description: 'Conteo de mensajes de chat no leídos' })
  messages: MessageSummary;
}