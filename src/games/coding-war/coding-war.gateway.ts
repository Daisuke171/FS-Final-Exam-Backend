import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CodingWarService } from './coding-war.service';
import { GameState } from './cw-state.enum';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CodingWarGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  server: Server;
  constructor(private readonly gamesService: CodingWarService) {}

  handleConnection(client: Socket) {
    return `Welcome ${client.id}!`;
  }

  handleDisconnect(client: Socket) {
    return `Goodbye ${client.id}!`;
  }

  @SubscribeMessage('game:create-lobby')
  createGame(client: Socket, data: { room: string }) {
    try {
      const result: GameState = this.gamesService.createGame(data.room);
      if (result === GameState.inLobby) return `Lobby ${data.room} created`;
    } catch (e) {
      return `Error creating lobby ${data.room}: ${e}`;
    }
  }
}
