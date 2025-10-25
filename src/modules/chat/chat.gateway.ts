import {
  WebSocketGateway, WebSocketServer,
  OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect,
  SubscribeMessage, ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { OnModuleDestroy } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { ObservableService } from '@common/observable.service';
import { Subscription } from 'rxjs';

const room = (chatId: string) => `chat:${chatId}`;

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*', credentials: true },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy {

  @WebSocketServer() server!: Server;

  private users = new Map<string, { id: string; username?: string }>();
  private busSub?: Subscription;

  constructor(
    private readonly chat: ChatService,
    private readonly bus: ObservableService,
  ) {}

  afterInit() {
    this.busSub = this.bus.events$.subscribe((e) => {
      if (e.type === 'chatMessage') {
        const m = e.data as { chatId: string };
        this.server.to(room(m.chatId)).emit('chat:new', e.data);
      }
      if (e.type === 'chatMessageUpdated') {
        const m = e.data as { chatId: string; id: string; read: boolean };
        this.server.to(room(m.chatId)).emit('chat:read', {
          chatId: m.chatId,
          messageId: m.id,
          read: m.read,
        });
      }
    });
  }

  onModuleDestroy() {
    this.busSub?.unsubscribe();
  }

  handleConnection(client: Socket) {
    // Si usás JWT en handshake: decodificar y setear users map acá
    // const user = decode(client.handshake.auth?.token)
    // this.users.set(client.id, { id: user.sub, username: user.name })
  }

  handleDisconnect(client: Socket) {
    this.users.delete(client.id);
  }

  // Solo si aún no hay auth en handshake
  @SubscribeMessage('chat:set_user')
  setUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() user: { id: string; username?: string },
  ) {
    this.users.set(client.id, user);
    client.emit('chat:user_set', { ok: true });
  }

  @SubscribeMessage('chat:join')
  async joinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() { chatId }: { chatId: string },
  ) {
    this.ensureUser(client);
    await client.join(room(chatId));

    const last = await this.chat.getMessages(chatId);
    client.emit('chat:history', last);
  }

  @SubscribeMessage('chat:leave')
  async leaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() { chatId }: { chatId: string },
  ) {
    this.ensureUser(client);
    await client.leave(room(chatId));
  }

  @SubscribeMessage('chat:send')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() { chatId, text }: { chatId: string; text: string },
  ) {
    const user = this.ensureUser(client);
    const saved = await this.chat.sendMessage({
      chatId,
      senderId: user.id,
      message: text,
    });

    client.emit('chat:sent', saved);
  }

  @SubscribeMessage('chat:read')
  async readMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() { chatId, messageId }: { chatId: string; messageId: string },
  ) {
    this.ensureUser(client);
    await this.chat.markRead(chatId, messageId);
  }

  private ensureUser(client: Socket) {
    const user = this.users.get(client.id);
    if (!user) {
      client.emit('chat:error', { message: 'Auth required (set_user or JWT)' });
      throw new Error('Unauthorized socket');
    }
    return user;
  }
}
