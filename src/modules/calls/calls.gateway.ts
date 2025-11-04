import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

type JoinPayload = { room: string; user?: string };

@WebSocketGateway({
  namespace: '/call',
  cors: { origin: '*', credentials: true },
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 1e7, // ~10MB
})
export class CallGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() io: Server;

  afterInit() {
    console.log('CallGateway ready');
  }

  handleConnection(client: Socket) {
    client.data.user = `u-${Math.random().toString(36).slice(2, 6)}`;
  }

  handleDisconnect(client: Socket) {
    const room = client.data.room as string | undefined;
    if (room) client.to(room).emit('peer:left', { user: client.data.user });
  }

  @SubscribeMessage('join')
  onJoin(@MessageBody() body: JoinPayload, @ConnectedSocket() client: Socket) {
    const room = (body?.room || 'demo').trim();
    client.join(room);
    client.data.room = room;
    client.data.user = body?.user || client.data.user;

    client.emit('joined', { room, user: client.data.user });
    client.to(room).emit('peer:joined', { user: client.data.user });
  }


  @SubscribeMessage('audio')
  onAudio(@MessageBody() data: ArrayBuffer, @ConnectedSocket() client: Socket) {
    const room = client.data.room as string | undefined;
    if (!room) return;

    // Re-difundir al resto (excluyendo emisor)
    client.to(room).emit('audio', data);
  }

  @SubscribeMessage('mute')
  onMute(@MessageBody() muted: boolean, @ConnectedSocket() client: Socket) {
    const room = client.data.room as string | undefined;
    if (!room) return;
    client.to(room).emit('peer:mute', { user: client.data.user, muted });
  }
}
