import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ObservableService } from '@common/observable.service';
import type { Notification as PrismaNotification } from '@prisma/client';
import { CreateNotificationInput } from './dto/create-notificacion.input';

type NotificationBusPayload = {
  id: string;
  type: string;
  entity: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly observable: ObservableService,
  ) {}

  async create(input: CreateNotificationInput): Promise<PrismaNotification> {
    const notification = await this.prisma.notification.create({
      data: {
        type: input.type,
        entity: input.entity,
        userId: input.userId,
      },
    });

    // broadcast (NotificationGateway re-emite por socket)
    const payload: NotificationBusPayload = {
      id: notification.id,
      type: notification.type,
      entity: notification.entity,
      userId: notification.userId,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };

    this.observable.notify({ type: 'notification', data: payload });
    return notification;
  }

  async byUser(userId: string): Promise<PrismaNotification[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}