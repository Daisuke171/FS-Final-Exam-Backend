import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ObservableService } from '../../common/observable.service';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private observable: ObservableService) {}

  afterInit() {
    // Se suscribe a los eventos del ObservableService
    this.observable.events$.subscribe(event => {
      if (event.type === 'chatMessage') {
        this.server.emit('newMessage', event.data);
      }
    });
  }

  handleConnection(socket: any) {
    console.log(`🟢 Client connected: ${socket.id}`);
  }
}
