// src/modules/notification-listener/notification-listener.module.ts

import { Module } from '@nestjs/common';
import { NotificationListenerService } from './notification-listener.service';
import { PrismaModule } from 'prisma/prisma.module'; 
import { CommonModule } from '../../common/common.module'; // Módulo del ObservableService

@Module({
  imports: [
    PrismaModule,
    CommonModule, // Importa el CommonModule para acceder al ObservableService (Bus de eventos)
  ],
  providers: [NotificationListenerService], // Lista el servicio que contiene la lógica de escucha y guardado
  exports: [NotificationListenerService],
})
export class NotificationListenerModule {}