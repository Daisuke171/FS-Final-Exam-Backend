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
import {
  Moves,
  Game,
  StartingState,
  PlayingState,
  FinishedState,
} from '../states/rps.states';
import { GamesService } from '@modules/games/games.service';
import { UserService } from '@modules/user/user.service';
import { JwtService } from '@nestjs/jwt';

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
interface PlayerInfo {
  nickname: string;
  userId: string;
}

@WebSocketGateway({
  namespace: '/rps',
  cors: {
    origin: '*',
  },
})
export class RpsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private playerRooms: Map<string, string> = new Map();
  private playerInfo: Map<string, PlayerInfo> = new Map();
  private disconnectionTimers: Map<string, NodeJS.Timeout> = new Map();

  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();
  private heartbeatTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private readonly HEARTBEAT_INTERVAL = 5000;
  private readonly HEARTBEAT_TIMEOUT = 12000;

  constructor(
    private gameService: RpsService,
    private gameApiService: GamesService,
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.emit('error', { message: 'Token no proporcionado' });
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub;

      if (!userId) {
        client.disconnect();
        return;
      }

      const user = await this.usersService.getMe(userId);

      if (!user) {
        client.disconnect();
        return;
      }

      client.data.userId = userId;
      client.data.nickname = user.nickname;

      const existingClientId = Array.from(this.playerInfo.entries()).find(
        ([, info]) => info.userId === userId,
      )?.[0];

      if (existingClientId && this.disconnectionTimers.has(existingClientId)) {
        console.log(
          `♻️ Jugador ${user.nickname} reconectándose, cancelando timer`,
        );

        const timer = this.disconnectionTimers.get(existingClientId);
        if (timer) {
          clearTimeout(timer);
          this.disconnectionTimers.delete(existingClientId);
        }

        const roomId = this.playerRooms.get(existingClientId);
        if (roomId) {
          this.playerRooms.delete(existingClientId);
          this.playerRooms.set(client.id, roomId);
          void client.join(roomId);

          this.server.to(roomId).emit('playerReconnected', {
            nickname: user.nickname,
          });

          const game = this.gameService.getGame(roomId);
          if (game) {
            this.emitGameState(roomId, game);
          }
        }

        this.playerInfo.delete(existingClientId);

        this.stopHeartbeat(existingClientId);
      }

      this.playerInfo.set(client.id, {
        nickname: user.nickname || client.id,
        userId: userId,
      });

      client.emit('authenticated', {
        userId,
        nickname: user.nickname,
        socketId: client.id,
      });

      this.startHeartbeat(client);

      client.on('heartbeat-response', () => {
        this.resetHeartbeatTimeout(client.id);
      });
    } catch (error) {
      console.error('Error en autenticación de WebSocket:', error);
      client.emit('error', { message: 'Error de autenticación' });
      client.disconnect();
    }
  }

  private startHeartbeat(client: Socket) {
    this.stopHeartbeat(client.id);

    const interval = setInterval(() => {
      if (client.connected) {
        client.emit('heartbeat-ping');
        this.resetHeartbeatTimeout(client.id);
      } else {
        this.stopHeartbeat(client.id);
      }
    }, this.HEARTBEAT_INTERVAL);

    this.heartbeatIntervals.set(client.id, interval);
    this.resetHeartbeatTimeout(client.id);
  }

  private resetHeartbeatTimeout(clientId: string) {
    const oldTimeout = this.heartbeatTimeouts.get(clientId);
    if (oldTimeout) {
      clearTimeout(oldTimeout);
    }

    const timeout = setTimeout(() => {
      console.log(`💔 Cliente ${clientId} no responde al heartbeat`);

      const client = this.server.sockets.sockets.get(clientId);
      if (client) {
        this.handleDisconnect(client);
        client.disconnect(true);
      }
    }, this.HEARTBEAT_TIMEOUT);

    this.heartbeatTimeouts.set(clientId, timeout);
  }

  private stopHeartbeat(clientId: string) {
    const interval = this.heartbeatIntervals.get(clientId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(clientId);
    }

    const timeout = this.heartbeatTimeouts.get(clientId);
    if (timeout) {
      clearTimeout(timeout);
      this.heartbeatTimeouts.delete(clientId);
    }
  }

  private resetHeartbeatOnActivity(clientId: string) {
    this.resetHeartbeatTimeout(clientId);
  }

  handleDisconnect(client: Socket) {
    this.stopHeartbeat(client.id);
    const roomId = this.playerRooms.get(client.id);
    if (!roomId) {
      this.playerInfo.delete(client.id);
      return;
    }

    const game = this.gameService.getGame(roomId);
    if (!game) {
      this.playerRooms.delete(client.id);
      this.playerInfo.delete(client.id);
      return;
    }

    const playerInfo = this.playerInfo.get(client.id);
    const nickname = playerInfo?.nickname || client.id;

    const currentState = game.getCurrentState();
    if (currentState === 'PlayingState' || currentState === 'RevealingState') {
      console.log(
        `⏱️ Jugador ${nickname} desconectado durante partida, iniciando contador de 10s`,
      );

      this.server.to(roomId).emit('playerDisconnected', {
        nickname,
        reconnectionTime: 10,
      });

      const timer = setTimeout(() => {
        console.log(`❌ Tiempo agotado para ${nickname}`);

        const currentGame = this.gameService.getGame(roomId);
        if (!currentGame) {
          this.disconnectionTimers.delete(client.id);
          return;
        }

        const opponent = Array.from(currentGame.players.keys()).find(
          (p) => p !== nickname,
        );

        if (opponent) {
          this.handleAutoWin(roomId, opponent, nickname);
        }

        this.playerRooms.delete(client.id);
        this.disconnectionTimers.delete(client.id);
        this.playerInfo.delete(client.id);
      }, 10000);

      this.disconnectionTimers.set(client.id, timer);
    } else {
      console.log(`❌ Jugador ${nickname} desconectado fuera de partida`);
      game.disconnect(nickname);
      game.clearReady(nickname);
      this.playerRooms.delete(client.id);

      if (game.players.size > 0) {
        this.emitGameState(roomId, game);
      } else {
        this.gameService.deleteGame(roomId);
      }
    }

    this.playerInfo.delete(client.id);
  }

  private getPlayerInfo(clientId: string): PlayerInfo {
    return (
      this.playerInfo.get(clientId) || {
        nickname: clientId,
        userId: '',
      }
    );
  }

  private handleAutoWin(
    roomId: string,
    winner: string,
    disconnectedPlayer: string,
  ) {
    const game = this.gameService.getGame(roomId);
    if (!game) return;

    console.log(
      `🏆 Victoria automática para ${winner} por desconexión de ${disconnectedPlayer}`,
    );

    game.setHP(disconnectedPlayer, 0);

    const winnerHp = game.getHP(winner);

    game.history.push({
      round: game.history.length + 1,
      player1Move: Moves.ROCK,
      player2Move: Moves.ROCK,
      winner: winner,
      hpAfter: {
        [winner]: winnerHp,
        [disconnectedPlayer]: 0,
      },
    });

    this.server.to(roomId).emit('playerDisconnectedTimeout', {
      winner,
      disconnectedPlayer,
      reason: 'timeout',
    });

    game.setState(new FinishedState());
  }

  @SubscribeMessage('playerReadyForMatch')
  handlePlayerReadyForMatch(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.resetHeartbeatOnActivity(client.id);
    try {
      const game = this.gameService.getGame(data.roomId);
      const playerInfo = this.getPlayerInfo(client.id);
      const nickname = playerInfo.nickname;

      if (!game) {
        console.error(
          `[playerReadyForMatch] Juego no encontrado: ${data.roomId}`,
        );
        client.emit('error', { message: 'Juego no encontrado' });
        return;
      }

      if (!game.players.has(nickname)) {
        console.error(
          `[playerReadyForMatch] Jugador ${nickname} no está en el juego`,
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
        playingState.handlePlayerReady(nickname, game);
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
    this.resetHeartbeatOnActivity(client.id);
    const roomId = data.roomId;
    const game = this.gameService.getGame(roomId);
    const playerInfo = this.getPlayerInfo(client.id);
    const nickname = playerInfo.nickname;
    if (!game) {
      client.emit('error', 'Juego no encontrado');
      return;
    }

    const isReady = data.ready ?? true;
    game.setReady(nickname, isReady);

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
    this.resetHeartbeatOnActivity(client.id);
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const playerInfo = this.getPlayerInfo(client.id);
    const nickname = playerInfo.nickname;

    const roomConfig = {
      name: data.roomName,
      isPrivate: data.isPrivate,
      password: data.password,
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

    game.join(nickname);
    game.playerUserIds.set(nickname, playerInfo.userId);
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
    this.resetHeartbeatOnActivity(client.id);
    console.log(`Cliente ${client.id} quiere unirse a la sala ${data.roomId}`);
    const playerInfo = this.getPlayerInfo(client.id);
    const nickname = playerInfo.nickname;
    const game: Game | undefined = this.gameService.getGame(data.roomId);

    if (!game) {
      client.emit('joinRoomError', {
        message: 'La sala no existe o ya finalizó',
      });
      return;
    }

    if (game.players.has(nickname)) {
      console.log(`Cliente ${nickname} ya está en la sala ${data.roomId}`);
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
    game.join(nickname);
    game.playerUserIds.set(nickname, playerInfo.userId);
    void client.join(data.roomId);
    this.playerRooms.set(client.id, data.roomId);
    this.emitGameState(data.roomId, game);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.resetHeartbeatOnActivity(client.id);
    console.log(`Cliente ${client.id} quiere salir de la sala ${data.roomId}`);

    const playerInfo = this.getPlayerInfo(client.id);
    const nickname = playerInfo.nickname;
    const game = this.gameService.getGame(data.roomId);

    if (!game) {
      client.emit('error', 'Juego no encontrado');
      return;
    }

    game.disconnect(nickname);
    game.clearReady(nickname);

    void client.leave(data.roomId);

    this.playerRooms.delete(client.id);

    client.emit('leftRoom', { roomId: data.roomId });

    if (game.players.size > 0) {
      this.emitGameState(data.roomId, game);
    } else {
      this.gameService.deleteGame(data.roomId);
    }
  }

  @SubscribeMessage('makeMove')
  handleMakeMove(
    @MessageBody() data: { roomId: string; move: Moves },
    @ConnectedSocket() client: Socket,
  ) {
    this.resetHeartbeatOnActivity(client.id);
    const game: Game | undefined = this.gameService.getGame(data.roomId);
    const playerInfo = this.getPlayerInfo(client.id);
    const nickname = playerInfo.nickname;
    if (!game) {
      client.emit('error', 'Juego no encontrado');
      return;
    }

    game.move(nickname, data.move);
    this.emitGameState(data.roomId, game);
  }
  @SubscribeMessage('getPublicRooms')
  handleGetPublicRooms(@ConnectedSocket() client: Socket) {
    this.resetHeartbeatOnActivity(client.id);
    const publicRooms = this.gameService.getPublicRooms();
    client.emit('publicRoomsList', publicRooms);
  }
  @SubscribeMessage('roomChat')
  handleRoomChat(client: Socket, payload: { roomId: string; message: string }) {
    const { roomId, message } = payload;
    const playerInfo = this.getPlayerInfo(client.id);
    const nickname = playerInfo.nickname;
    const timestamp = new Date().toISOString();
    console.log(`Mensaje en sala ${roomId} de ${nickname}: ${message}`);
    this.server.to(roomId).emit('roomChatMessages', {
      playerId: nickname,
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
    const playerInfo = this.getPlayerInfo(client.id);
    const nickname = playerInfo.nickname;
    if (!game) {
      client.emit('error', 'Juego no encontrado');
      return;
    }

    const isInRoom = this.playerRooms.get(client.id) === data.roomId;
    if (!isInRoom) {
      if (game.players.has(nickname)) {
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
