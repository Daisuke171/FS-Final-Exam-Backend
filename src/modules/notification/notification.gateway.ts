import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ObservableService } from '../../common/observable.service';

@WebSocketGateway({ cors: true })
export class NotificationGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;

  constructor(private observable: ObservableService) {}

  afterInit() {
    this.observable.events$.subscribe(event => {
      if (event.type === 'notification') {
        this.server.emit('newNotification', event.payload);
      }
    });
  }
}
