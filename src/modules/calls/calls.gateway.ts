import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ObservableService } from '@common/observable.service';

@WebSocketGateway({ cors: true })
export class CallGateway {
  @WebSocketServer() 
  server!: Server;

  constructor(private observable: ObservableService) {
    this.observable.events$.subscribe(event => {
      if (event.type === 'call') {
        this.server.emit('callEvent', event.data);
      }
    });
  }

  startCall(callerId: string, receiverId: string) {
    this.observable.notify({
      type: 'call',
      data: { callerId, receiverId, status: 'ringing' },
    });
  }
}
