import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TestService } from '../test.service';
import { Game } from '../states/test.states';

interface StateProps {
  state: string;
  players: string[];
  spectators: string[];
  readyPlayers: string[];
  playerCount: number;
  roomInfo: {
    id: string;
    name: string;
    maxPlayers: number;
    currentPlayers: number;
    isPrivate: boolean;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TestGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private playerRooms: Map<string, string> = new Map();

  constructor(private gameService: TestService) {}

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);

    const roomId = this.playerRooms.get(client.id);
    if (roomId) {
      const game = this.gameService.getGame(roomId);
      if (game) {
        game.disconnect(client.id);
        if (game.players.size > 0) {
          this.emitGameState(roomId, game);
        }
      }
      this.playerRooms.delete(client.id);
    }
  }

  // Placeholder game has no ready/match flow

  @SubscribeMessage('createRoom')
  handleCreateRoom(
    @MessageBody()
    data: { roomName: string; isPrivate: boolean; password?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = `test_room_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const roomConfig = {
      name: data.roomName,
      isPrivate: data.isPrivate,
      password: data.password,
    };

    const game = this.gameService.createGame(roomId, roomConfig);
    game.setEmitCallback((event, payload) => {
      this.server.to(roomId).emit(event, payload);
    });

    game.setOnRoomEmptyCallback((emptyRoomId) => {
      this.gameService.deleteGame(emptyRoomId);
    });

    game.join(client.id);

    void client.join(roomId);
    this.playerRooms.set(client.id, roomId);

    client.emit('roomCreated', {
      roomId,
      roomInfo: {
        id: roomId,
        name: data.roomName,
        maxPlayers: 2,
        currentPlayers: 1,
        isPrivate: data.isPrivate,
      },
    });

    this.server
      .to(client.id)
      .emit('joinRoomSuccess', { roomId, role: 'player' });

    this.emitGameState(roomId, game);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { roomId: string; password?: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Cliente ${client.id} quiere unirse a la sala ${data.roomId}`);
    const game: Game | undefined = this.gameService.getGame(data.roomId);

    if (!game) {
      client.emit('joinRoomError', {
        message: 'La sala no existe o ya finaliz\u00f3',
      });
      return;
    }

    if (game.players.has(client.id)) {
      console.log(
        `Cliente ${client.id} ya est\u00e1 en la sala ${data.roomId}`,
      );
      this.emitGameState(data.roomId, game);
      return;
    }
    // allow spectators beyond two players
    // No state restriction in placeholder game

    if (game.roomConfig.isPrivate) {
      if (!data.password) {
        client.emit('isPrivate', {
          message: 'Esta sala es privada',
          roomId: data.roomId,
        });
        return;
      }
      if (game.roomConfig.password !== data.password) {
        client.emit('joinRoomError', {
          message: 'Contrase\u00f1a incorrecta',
        });
        return;
      }
    }
    game.setEmitCallback((event, payload) => {
      this.server.to(data.roomId).emit(event, payload);
    });
    game.setOnRoomEmptyCallback((emptyRoomId) => {
      this.gameService.deleteGame(emptyRoomId);
    });
    const role = game.join(client.id);
    this.server
      .to(client.id)
      .emit('joinRoomSuccess', { roomId: data.roomId, role });
    void client.join(data.roomId);
    this.playerRooms.set(client.id, data.roomId);
    this.emitGameState(data.roomId, game);
    console.log(this.emitGameState(data.roomId, game));
  }

  // No moves in placeholder
  @SubscribeMessage('getPublicRooms')
  handleGetPublicRooms(@ConnectedSocket() client: Socket) {
    const publicRooms = this.gameService.getPublicRooms();
    client.emit('publicRoomsList', publicRooms);
  }
  @SubscribeMessage('roomChat')
  handleRoomChat(client: Socket, payload: { roomId: string; message: string }) {
    const { roomId, message } = payload;
    const timestamp = new Date().toISOString();
    console.log(`Mensaje en sala ${roomId} de ${client.id}: ${message}`);
    this.server.to(roomId).emit('roomChatMessages', {
      playerId: client.id,
      message,
      timestamp,
    });
  }
  @SubscribeMessage('requestGameState')
  handleRequestGameState(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const game = this.gameService.getGame(data.roomId);
    if (!game) {
      client.emit('error', 'Juego no encontrado');
      return;
    }

    const isInRoom = this.playerRooms.get(client.id) === data.roomId;
    if (!isInRoom) {
      if (game.players.has(client.id)) {
        void client.join(data.roomId);
        this.playerRooms.set(client.id, data.roomId);
      } else {
        client.emit('error', 'No est\u00e1s en esta sala');
        return;
      }
    }

    const stateData: StateProps = this.buildStateData(game);
    client.emit('gameState', stateData);
  }

  private buildStateData(game: Game): StateProps {
    return {
      state: game.getCurrentState(),
      players: Array.from(game.players.keys()),
      spectators: Array.from(game.spectators.values()),
      readyPlayers: Array.from(game.readyPlayers.values()),
      playerCount: game.players.size,
      roomInfo: {
        id: game.roomId,
        name: game.roomConfig.name,
        maxPlayers: 2,
        currentPlayers: game.players.size,
        isPrivate: game.roomConfig.isPrivate,
      },
    };
  }

  private emitGameState(roomId: string, game: Game) {
    const stateData = this.buildStateData(game);
    this.server.to(roomId).emit('gameState', stateData);
  }

  @SubscribeMessage('test:confirmReady')
  handleConfirmReady(
    @MessageBody() data: { roomId: string; ready: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, ready } = data;
    const game = this.gameService.getGame(roomId);
    if (!game) return;
    if (!game.players.has(client.id)) return; // ignore spectators
    game.confirmReady(client.id, ready);
    this.emitGameState(roomId, game);
  }
}
