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
import { TDService } from '../turing-detective.service';
import { Game, StartingState } from '../states/turing-detective.states';
import { GamesService } from 'src/modules/games/games.service';
import { UserService } from '@modules/user/user.service';
import { JwtService } from '@nestjs/jwt';

interface StateProps {
  state: string;
  players: Array<{ id: string; nickname?: string; score?: number }>;
  playerCount: number;
  currentRound?: number;
  totalRounds?: number;
  chatMessages?: Array<{ sender: string; message: string; timestamp: number; isAI?: boolean }>;
  roundResults?: unknown;
  ready: Record<string, boolean>;
  roomInfo: {
    id: string;
    name: string;
    maxPlayers: number;
    currentPlayers: number;
    isPrivate: boolean;
  };
  result?: unknown;
}

@WebSocketGateway({
  namespace: '/turing-detective',
  cors: {
    origin: '*',
  },
})
export class TDGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private playerRooms: Map<string, string> = new Map();
  private playerInfo: Map<string, { nickname: string; userId: string }> =
    new Map();

  constructor(
    private gameService: TDService,
    private gameApiService: GamesService,
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      console.log(`[TD Gateway] Cliente conectando: ${client.id}`);
      console.log(
        `[TD Gateway] Token presente: ${!!token}, primeros 20 chars:`,
        token ? token.substring(0, 20) + '...' : 'N/A',
      );

      if (!token) {
        console.warn(`[TD Gateway] Token no proporcionado para ${client.id}`);
        client.emit('error', { message: 'Token no proporcionado' });
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      console.log(
        `[TD Gateway] Token verificado para ${client.id}, userId:`,
        payload.sub,
      );

      const userId = payload.sub;
      if (!userId) {
        console.warn(
          `[TD Gateway] No se encontró userId en payload para ${client.id}`,
        );
        client.disconnect();
        return;
      }

      const user = await this.usersService.getMe(userId);
      if (!user) {
        console.warn(
          `[TD Gateway] Usuario no encontrado en DB para userId: ${userId}`,
        );
        client.disconnect();
        return;
      }

      this.playerInfo.set(client.id, {
        nickname: user.nickname || client.id,
        userId,
      });

      console.log(
        `[TD Gateway] ✅ Cliente autenticado: ${client.id} (${user.nickname})`,
      );
      client.emit('authenticated', {
        userId,
        nickname: user.nickname,
        socketId: client.id,
      });
    } catch (error) {
      const err = error as any;
      console.error(
        '[TD Gateway] ❌ Error en autenticación de WebSocket (Turing Detective):',
        err.message || error,
      );
      if (err.name === 'TokenExpiredError') {
        console.error('[TD Gateway] Token expirado');
      } else if (err.name === 'JsonWebTokenError') {
        console.error('[TD Gateway] Token inválido');
      }
      client.emit('error', { message: 'Error de autenticación' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);

    const roomId = this.playerRooms.get(client.id);
    if (roomId) {
      const game = this.gameService.getGame(roomId);
      if (game) {
        game.disconnect(client.id);
        game.clearReady(client.id);
        if (game.players.size > 0) {
          this.emitGameState(roomId, game);
        }
      }
      this.playerRooms.delete(client.id);
    }
    this.playerInfo.delete(client.id);
  }

  // playerReadyForMatch removed — not applicable for Turing Detective

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

    // Build a complete RoomConfig with sensible defaults for Turing Detective
    const roomConfig = {
      name: data.roomName,
      isPrivate: data.isPrivate,
      password: data.password,
      totalRounds: 5,
      chatDuration: 60,
      votingDuration: 15,
    };

    const game = this.gameService.createGame(
      roomId,
      roomConfig,
      this.gameApiService,
      this.usersService,
    );
    game.setEmitCallback((event, payload) => {
      this.server.to(roomId).emit(event, payload);
    });

    game.setOnRoomEmptyCallback((emptyRoomId) => {
      this.gameService.deleteGame(emptyRoomId);
    });

    game.join(client.id);
    const info = this.playerInfo.get(client.id);
    if (info?.userId) {
      game.playerUserIds.set(client.id, info.userId);
    }

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
    @MessageBody() data: { roomId: string; password?: string },
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
          message: 'Contraseña incorrecta',
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
    this.server.to(client.id).emit('joinRoomSuccess', { roomId: data.roomId });
    game.join(client.id);
    const info = this.playerInfo.get(client.id);
    if (info?.userId) {
      game.playerUserIds.set(client.id, info.userId);
    }
    void client.join(data.roomId);
    this.playerRooms.set(client.id, data.roomId);
    this.emitGameState(data.roomId, game);
  }

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
        client.emit('error', 'No estás en esta sala');
        return;
      }
    }

    const stateData: StateProps = this.buildStateData(game);
    client.emit('gameState', stateData);
  }

  // Typing-related events removed — Turing Detective uses chat and voting

  private buildStateData(game: Game): StateProps {
    const stateData: StateProps = {
      state: game.getCurrentState(),
      players: Array.from(game.players.values()).map((p) => ({
        id: p.id,
        nickname: p.nickname,
        score: p.score,
      })),
      playerCount: game.players.size,
      currentRound: game.currentRound,
      totalRounds: game.roomConfig.totalRounds,
      chatMessages: game.chatMessages,
      roundResults: game.roundResults,
      ready: Object.fromEntries(game.ready.entries()),
      roomInfo: {
        id: game.roomId,
        name: game.roomConfig.name,
        maxPlayers: 2,
        currentPlayers: game.players.size,
        isPrivate: game.roomConfig.isPrivate,
      },
      result: game.result,
    };
    return stateData;
  }

  private emitGameState(roomId: string, game: Game) {
    const stateData = this.buildStateData(game);
    this.server.to(roomId).emit('gameState', stateData);
  }
}
