import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { OnModuleDestroy } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { ObservableService } from '@common/observable.service';
import { Subscription } from 'rxjs';
import { PrismaService } from 'prisma/prisma.service';

const room = (chatId: string) => `chat:${chatId}`;

@WebSocketGateway({
namespace: '/chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleDestroy
{
  @WebSocketServer() server!: Server;

  private users = new Map<string, { id: string; username?: string }>();
  private busSub?: Subscription;

  constructor(
    private readonly chat: ChatService,
    private readonly bus: ObservableService,
     private readonly prisma: PrismaService,
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

  handleConnection() {
  }

  handleDisconnect(client: Socket) {
    this.users.delete(client.id);
    console.log("cliente deconectado");
    
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

    const last = await this.prisma.chatMessage.findMany({
    where: { chatId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
    client.emit('chat:history', last.reverse());   
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
   sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() { chatId, text }: { chatId: string; text: string },
  ) {
    const user = this.ensureUser(client);
    const saved =  this.chat.sendMessage({
      chatId,
      senderId: user.id,
      message: text,
    });

    client.emit('chat:sent', saved);
    this.server.to(chatId).emit('chat:sent', saved);
    console.log(`Chat ${chatId} enviado mensaje ${text}`);
    console.log(`Usuario ${user} envió ${saved}`);
  }

  @SubscribeMessage('chat:read')
  async readMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() { chatId, messageId }: { chatId: string; messageId: string },
  ) {
    this.ensureUser(client);
    await this.chat.markRead(chatId, messageId);
    this.server.to(client.id).emit('chat:read', { chatId, messageId });
    console.log(`Chat ${chatId} mencionado como leído por ${client.id}`);
    
  }

    @SubscribeMessage('chat:readAll')
  async readAllMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() { chatId, userId }: { chatId: string; userId: string },
  ) {
    this.ensureUser(client);
    await this.chat.markAllRead(chatId, userId);
    this.server.to(client.id).emit('chat:readAll', { chatId, userId });
    console.log(`Chat ${chatId} mencionado como todos los msgs leídos por ${client.id}`);
    
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
