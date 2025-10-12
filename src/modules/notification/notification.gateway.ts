import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ObservableService } from '../../common/observable.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationGateway implements OnGatewayInit {
  @WebSocketServer() server!: Server;

  constructor(private readonly bus: ObservableService) {}

  afterInit() {
    this.bus.events$.subscribe((e) => {
      if (e.type === 'notification') {
        this.server.emit('newNotification', e.data);
      }
    });
  }
}
