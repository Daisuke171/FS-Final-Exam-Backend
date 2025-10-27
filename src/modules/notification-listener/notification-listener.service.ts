import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; // 💡 
import { ObservableService } from '../../common/observable.service'; 
import { ChallengeStatus } from '@prisma/client'; 

@Injectable()
export class NotificationListenerService implements OnModuleInit {
  constructor(
    // El constructor es correcto para la inyección de dependencias
    private readonly observableService: ObservableService,
    private readonly prisma: PrismaService, 
  ) {}

  // Se llama automáticamente cuando el módulo inicia
  onModuleInit() {
    // Es CRÍTICO iniciar la escucha después de que los módulos estén cargados
    this.subscribeToSocialEvents();
  }

  private subscribeToSocialEvents() {
    console.log('[NOTIF LISTENER] Suscribiéndose a eventos de notificación...');
    
    // Nos suscribimos al bus de eventos del sistema
    this.observableService.events$.subscribe((event: { type: string; data: any }) => {
      
      // Lógica 1: Capturar la señal de aceptación de amistad
      if (event.type === 'notification' && event.data.type === 'friend:accepted') {
        const payload = event.data;
        
        this.prisma.notification.create({
          data: {
            userId: payload.userId, 
            entity: `¡La solicitud de amistad ha sido aceptada!`, 
            
            // 💡 CAMPO DE LECTURA: Se asigna 'false' por defecto en la DB, pero lo enviamos por seguridad de tipado
            isRead: false,
            
            // 💡 CAMPO DE CLASIFICACIÓN (Para el Home Dashboard)
            challengeType: ChallengeStatus.ALERT, 
            
            // 💡 CAMPO ANTIGUO (Lo mantenemos con un valor descriptivo para la lógica de tu compañero)
            type: 'FRIEND_ACCEPTED_ALERT', 
          },
        }).then(() => {
          console.log(`[NOTIF LISTENER] Alerta guardada para el Home.`);
        });
      }
      
      // 💡 Lógica 2: Nueva Solicitud de Amistad (Para completar la funcionalidad social)
      if (event.type === 'notification' && event.data.type === 'friend:request') {
        const payload = event.data;
        
        this.prisma.notification.create({
          data: {
            userId: payload.userId, 
            entity: `Tienes una nueva solicitud de amistad pendiente.`, 
            isRead: false,
            challengeType: ChallengeStatus.ALERT,
            type: 'FRIEND_REQUEST_ALERT', 
          },
        });
      }
    });
  }
}