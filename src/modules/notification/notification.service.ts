import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ObservableService } from '../../common/observable.service';

@Injectable()
export class NotificationService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private observable: ObservableService,
  ) {}

  onModuleInit() {
    // Se suscribe a los eventos del chat
    this.observable.events$.subscribe(async (event) => {
      if (event.type === 'chatMessage') {
        const { chat } = event.payload;

        // Crear notificación para el receptor del mensaje
        await this.prisma.notifications.create({
          data: {
            userId: chat.friend.userId,
            type: 'message',
            entity: chat.Id,
          },
        });

        // Emitir evento de notificación
        this.observable.notify({
          type: 'notification',
          payload: {
            userId: chat.friend.userId,
            message: 'Nuevo mensaje recibido',
          },
        });
      }
    });
  }
}
