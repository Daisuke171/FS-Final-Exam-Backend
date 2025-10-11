import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from './room.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly roomService: RoomService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const result = this.roomService.leaveAllRooms(client);
    const rooms = this.roomService.getUserInAllRooms(client);

    // leave all rooms when disconnecting
    for (const room of rooms) {
      void client.leave(room);
    }

    console.log(client.id, result);
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('test')
  handleMessage() {
    this.server.emit('hello', 'Hello from server!');
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    if (data.room === undefined) {
      console.log('Room is undefined');
      return;
    }

    /// save logs
    const result = this.roomService.joinRoom(client, data.room);
    const usersNow = this.roomService.getUsersInRoom(data.room);
    console.log(result, usersNow);

    /// socket room join
    void client.join(data.room);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    /// save logs
    const result = this.roomService.leaveRoom(client, data.room);
    const usersNow = this.roomService.getUsersInRoom(data.room);
    console.log(result, usersNow);

    /// socket room leave
    void client.leave(data.room);
  }
}
