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
import { RpsService } from '../rps.service';
import { Moves, Game, StartingState, PlayingState } from '../states/rps.states';

interface StateProps {
  state: string;
  players: string[];
  playerCount: number;
  result?: unknown;
  history?: unknown;
  ready: Record<string, boolean>;
  hp: Record<string, number>;
  currentMoves: Record<string, Moves>;
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
export class RpsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private playerRooms: Map<string, string> = new Map();

  constructor(private gameService: RpsService) {}

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
        game.clearReady(client.id);
        this.emitGameState(roomId, game);
      }
      this.playerRooms.delete(client.id);
    }
  }

  @SubscribeMessage('playerReadyForMatch')
  handlePlayerReadyForMatch(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const game = this.gameService.getGame(data.roomId);

      if (!game) {
        console.error(
          `[playerReadyForMatch] Juego no encontrado: ${data.roomId}`,
        );
        client.emit('error', { message: 'Juego no encontrado' });
        return;
      }

      if (!game.players.has(client.id)) {
        console.error(
          `[playerReadyForMatch] Jugador ${client.id} no está en el juego`,
        );
        client.emit('error', { message: 'No estás en este juego' });
        return;
      }

      const currentState = game.getCurrentState();
      console.log(`[playerReadyForMatch] Estado actual: ${currentState}`);

      if (currentState !== 'PlayingState') {
        console.warn(
          `[playerReadyForMatch] Estado incorrecto: ${currentState}`,
        );
        return;
      }

      const playingState = game['state'] as PlayingState;
      if (
        playingState &&
        typeof playingState.handlePlayerReady === 'function'
      ) {
        playingState.handlePlayerReady(client.id, game);
      }
    } catch (error) {
      console.error('[playerReadyForMatch] Error:', error);
      client.emit('error', { message: 'Error al procesar ready' });
    }
  }

  @SubscribeMessage('confirmReady')
  handleConfirmReady(
    @MessageBody() data: { roomId: string; ready?: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = data.roomId;
    const game = this.gameService.getGame(roomId);
    if (!game) {
      client.emit('error', 'Juego no encontrado');
      return;
    }

    const isReady = data.ready ?? true;
    game.setReady(client.id, isReady);

    this.emitGameState(roomId, game);

    if (game.isAllReady() && game.players.size === 2) {
      game.moves.clear();

      game.setState(new StartingState());
      this.emitGameState(roomId, game);
    }
  }

  @SubscribeMessage('createRoom')
  handleCreateRoom(
    @MessageBody()
    data: { roomName: string; isPrivate: boolean; password?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const roomConfig = {
      name: data.roomName,
      isPrivate: data.isPrivate,
      password: data.password,
    };

    const game = this.gameService.createGame(roomId, roomConfig);
    game.setEmitCallback((event, payload) => {
      this.server.to(roomId).emit(event, payload);
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

    this.emitGameState(roomId, game);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Cliente ${client.id} quiere unirse a la sala ${data.roomId}`);
    const game: Game | undefined = this.gameService.getGame(data.roomId);

    if (!game) {
      client.emit('joinRoomError', {
        message: 'La sala no existe o ya finalizó',
      });
      return;
    }

    if (game.players.has(client.id)) {
      console.log(`Cliente ${client.id} ya está en la sala ${data.roomId}`);
      this.emitGameState(data.roomId, game);
      return;
    }
    if (game.players.size >= 2) {
      client.emit('joinRoomError', {
        message: 'La sala está llena',
      });
      return;
    }
    if (game.getCurrentState() !== 'WaitingState') {
      client.emit('joinRoomError', {
        message: 'La partida ya comenzó',
      });
      return;
    }
    game.setEmitCallback((event, payload) => {
      this.server.to(data.roomId).emit(event, payload);
    });
    this.server.to(client.id).emit('joinRoomSuccess', { roomId: data.roomId });
    game.join(client.id);
    void client.join(data.roomId);
    this.playerRooms.set(client.id, data.roomId);
    this.emitGameState(data.roomId, game);
    console.log(this.emitGameState(data.roomId, game));
  }

  @SubscribeMessage('makeMove')
  handleMakeMove(
    @MessageBody() data: { roomId: string; move: Moves },
    @ConnectedSocket() client: Socket,
  ) {
    const game: Game | undefined = this.gameService.getGame(data.roomId);
    if (!game) {
      client.emit('error', 'Juego no encontrado');
      return;
    }

    game.move(client.id, data.move);
    this.emitGameState(data.roomId, game);
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
        client.emit('error', 'No estás en esta sala');
        return;
      }
    }

    const stateData: StateProps = this.buildStateData(game);
    client.emit('gameState', stateData);
  }

  private buildStateData(game: Game): StateProps {
    const stateData: StateProps = {
      state: game.getCurrentState(),
      players: Array.from(game.players.keys()),
      playerCount: game.players.size,
      history: game.history,
      ready: Object.fromEntries(game.ready.entries()),
      hp: Object.fromEntries(game.hp.entries()),
      currentMoves: Object.fromEntries(game.moves.entries()),
      roomInfo: {
        id: game.roomId,
        name: game.roomConfig.name,
        maxPlayers: 2,
        currentPlayers: game.players.size,
        isPrivate: game.roomConfig.isPrivate,
      },
    };
    if (game.result) {
      stateData.result = game.result;
    }
    return stateData;
  }

  private emitGameState(roomId: string, game: Game) {
    const stateData = this.buildStateData(game);
    this.server.to(roomId).emit('gameState', stateData);
  }
}
