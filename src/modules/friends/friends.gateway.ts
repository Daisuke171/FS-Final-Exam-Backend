// friends.gateway.ts
import {
  WebSocketGateway, WebSocketServer, OnGatewayInit,
  SubscribeMessage, MessageBody, ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ObservableService } from '@common/observable.service';
import { FriendsService } from './friends.service'; // servicio que da friends

@WebSocketGateway({ cors: { origin: '*' } })
export class FriendsGateway implements OnGatewayInit {
  @WebSocketServer() server!: Server;

  // conexiones por userId (soporta múltiples pestañas)
  private connCount = new Map<string, number>();

  constructor(
    private readonly bus: ObservableService,
    private readonly friends: FriendsService,   // ⬅️ lo definimos abajo
  ) {}

  afterInit() {
    // Si ya emitís notificaciones por bus, podés mantenerlo
    this.bus.events$.subscribe((e) => {
      if (e.type === 'notification') {
        const notify = e.data as any;
        if (typeof notify?.type === 'string' && notify.type.startsWith('friend:')) {
          this.server.to(`user-${notify.userId}`).emit('friend:event', notify);
        }
      }
    });
  }

  /** El cliente llama una vez por sesión para identificar usuario y entrar a su room */
  @SubscribeMessage('auth')
  async handleAuth(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket
  ) {
    const { userId } = data || {};
    if (!userId) return;

    client.join(`user-${userId}`);

    // ++ conexiones
    const n = (this.connCount.get(userId) ?? 0) + 1;
    this.connCount.set(userId, n);

    // si es la PRIMERA conexión, broadcast "online" a los amigos
    if (n === 1) {
      const friendIds = await this.friends.getFriendIds(userId);
      for (const fid of friendIds) {
        this.server.to(`user-${fid}`).emit('presence:update', {
          userId,
          online: true,
        });
      }
    }
  }

  /** Snapshot: lista de amigos online del usuario */
  @SubscribeMessage('presence:get')
  async handlePresenceGet(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket
  ) {
    const { userId } = data || {};
    if (!userId) return client.emit('presence:snapshot', []);
    const friendIds = await this.friends.getFriendIds(userId);
    const online = friendIds.filter((fid) => (this.connCount.get(fid) ?? 0) > 0);
    client.emit('presence:snapshot', online);
  }

  /** Detectar disconnect y broadcast "offline" si quedó en 0 */
  async handleDisconnect(client: Socket) {
    // El cliente no nos mandó userId en disconnect; lo normal es persistirlo en "data" del socket al auth.
    // Guardemos el último auth en client.data.userId
    const userId: string | undefined = client.data?.userId;

    if (userId) {
      const n = Math.max((this.connCount.get(userId) ?? 1) - 1, 0);
      this.connCount.set(userId, n);
      if (n === 0) {
        const friendIds = await this.friends.getFriendIds(userId);
        for (const fid of friendIds) {
          this.server.to(`user-${fid}`).emit('presence:update', {
            userId,
            online: false,
          });
        }
      }
    }
  }
}


/* import { WebSocketGateway, WebSocketServer, OnGatewayInit, MessageBody, SubscribeMessage, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ObservableService } from '../../common/observable.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class FriendsGateway implements OnGatewayInit {
  @WebSocketServer() server!: Server;

  constructor(private readonly bus: ObservableService) { }

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

  @SubscribeMessage('auth')
  handleAuth(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
    if (!data?.userId) return;
    client.join(`user-${data.userId}`);
  }
}
 */