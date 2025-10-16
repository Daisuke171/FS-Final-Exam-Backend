import { Resolver, Query, Mutation, Args, ID, Subscription } from '@nestjs/graphql';
import { Notification } from './models/notification.model';
import { NotificationService } from './notification.service';
import { CreateNotificationInput } from './dto/create-notificacion.input';
import { PubSub } from 'graphql-subscriptions';

const pubSub = new PubSub();

@Resolver(() => Notification)
export class NotificationResolver {
  constructor(private readonly service: NotificationService) {}

  // ========= Queries =========
  @Query(() => [Notification])
  notificationsByUser(@Args('userId', { type: () => ID }) userId: string) {
    return this.service.byUser(userId);
  }

  // ========= Mutations =========
  @Mutation(() => Notification)
  async createNotification(@Args('input') input: CreateNotificationInput) {
    const notificacion = await this.service.create(input);
    await pubSub.publish(`notificationCreated:${notificacion.userId}`, { notificationCreated: notificacion });
    return notificacion;
  }

  // ========= Subscriptions  =========
  @Subscription(() => Notification, {
    filter: (payload, variables) => payload.notificationCreated.userId === variables.userId,
    resolve: (payload) => payload.notificationCreated,
  })
  notificationCreated(@Args('userId', { type: () => ID }) userId: string) {
    return pubSub.asyncIterator(`notificationCreated:${userId}`);
  }
}