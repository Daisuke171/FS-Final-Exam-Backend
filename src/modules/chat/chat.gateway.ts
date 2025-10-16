import {
  WebSocketGateway, WebSocketServer, OnGatewayInit,
  OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage,
  ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { ObservableService } from '@common/observable.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer() server!: Server;

  // map simple de usuario con socket
  private users = new Map<string, { id: string; username: string }>();

  constructor(
    private readonly chat: ChatService,
    private readonly bus: ObservableService,
  ) {}

  afterInit(server: Server) {
    // escuchar bus y reenviar a chat correspondiente
    this.bus.events$.subscribe((e) => {
      if (e.type === 'chatMessage') {
        const message = e.data as { chatId: string };
        this.server.to(`chat-${message.chatId}`).emit('newMessage', e.data);
      }
    });
  }

  handleConnection(client: Socket) {
    console.log('connected', client.id);

  }

  handleDisconnect(client: Socket) {
    this.users.delete(client.id);
    console.log('disconnected', client.id);
  }

  @SubscribeMessage('set_user')
  setUser(@ConnectedSocket() client: Socket, @MessageBody() user: { id: string; username: string }) {
    this.users.set(client.id, user);
  }

  @SubscribeMessage('join_chat')
  joinChat(@ConnectedSocket() client: Socket, @MessageBody() chatId: string) {
    const user = this.users.get(client.id);
    if (!user) return client.emit('error', { message: 'set_user first' });
    client.join(`chat-${chatId}`);
  }

  @SubscribeMessage('send_message')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { chatId: string; message: string },
  ) {
    const user = this.users.get(client.id);
    if (!user) return client.emit('error', { message: 'set_user first' });
    const saved = await this.chat.sendMessage({ chatId: body.chatId, senderId: user.id, message: body.message });
    // respuesta directa al emisor
    client.emit('sent', saved);
  }

  @SubscribeMessage('get_messages')
  async getMessages(@ConnectedSocket() client: Socket, @MessageBody() data: { chatId: string }) {
    const messages = await this.chat.getMessages(data.chatId);
    client.emit('messages', messages);
  }

  @SubscribeMessage('read_message')
  async readMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { chatId: string; messageId: string }) {
    const message = await this.chat.markRead(data.chatId, data.messageId);
    this.server.to(`chat-${data.chatId}`).emit('message_read', message);
  }
}