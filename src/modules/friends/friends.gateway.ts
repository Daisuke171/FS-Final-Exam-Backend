import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ObservableService } from '../../common/observable.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class FriendsGateway implements OnGatewayInit {
  @WebSocketServer() server!: Server;

  constructor(private readonly bus: ObservableService) {}

  afterInit() {
    this.bus.events$.subscribe((e) => {
      if (e.type === 'notification') {
        const notify = e.data as any;
        // reenviar sólo eventos de amigos
        if (typeof notify?.type === 'string' && notify.type.startsWith('friend:')) {
          // segmentar por usuario:
          this.server.to(`user-${notify.userId}`).emit('friend:event', notify);
          //this.server.emit('friend:event', notify);
        }
      }
    });
  }
}
