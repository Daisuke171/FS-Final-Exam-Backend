import { getRandomMove } from '../utils/getRandomMove';

export enum Moves {
  ROCK = 'piedra',
  PAPER = 'papel',
  SCISSORS = 'tijera',
}

export abstract class GameState {
  abstract handleJoin(playerId: string, game: Game): void;
  abstract handleMove(playerId: string, move: Moves, game: Game): void;
  abstract handleDisconnect(playerId: string, game: Game): void;
  abstract onEnter(game: Game): void;
  onExit?: (game: Game) => void;
}

export interface RoundRecord {
  round: number;
  player1Move: Moves;
  player2Move: Moves;
  winner: string | null;
  hpAfter: { [playerId: string]: number };
}

export interface Player {
  id: string;
  socketId: string;
}

export interface GameResult {
  winner?: string | null;
  player1: { id: string; move: string };
  player2: { id: string; move: string };
}

export interface RoomConfig {
  name: string;
  isPrivate: boolean;
  password?: string;
}

export class Game {
  private state: GameState;
  public players: Map<string, Player> = new Map();
  public hp: Map<string, number> = new Map();
  public moves: Map<string, Moves> = new Map();
  public roomId: string;
  public roomConfig: RoomConfig;
  public result?: GameResult;
  public history: RoundRecord[] = [];
  public ready: Map<string, boolean> = new Map();
  private emitCallback?: (event: string, data: any) => void;

  constructor(roomId: string, roomConfig: RoomConfig, initialState: GameState) {
    this.roomId = roomId;
    this.roomConfig = roomConfig;
    this.state = initialState;
    if (this.state.onEnter) {
      this.state.onEnter(this);
    }
  }

  setReady(playerId: string, isReady: boolean) {
    this.ready.set(playerId, isReady);
  }

  clearReady(playerId: string) {
    this.ready.delete(playerId);
  }

  isAllReady(): boolean {
    if (this.players.size < 2) return false;
    for (const playerId of this.players.keys()) {
      if (!this.ready.get(playerId)) return false;
    }
    return true;
  }

  resetAllReady() {
    this.ready.clear();
  }

  setHP(playerId: string, hp: number) {
    this.hp.set(playerId, hp);
  }

  getHP(playerId: string): number {
    return this.hp.get(playerId) || 0;
  }

  setEmitCallback(cb: (event: string, data: any) => void) {
    this.emitCallback = cb;
  }

  emit(event: string, data: any) {
    if (this.emitCallback) {
      this.emitCallback(event, data);
    }
  }

  join(playerId: string) {
    if (this.state.handleJoin) {
      this.state.handleJoin(playerId, this);
    }
  }

  move(playerId: string, move: Moves) {
    if (this.state.handleMove) {
      this.state.handleMove(playerId, move, this);
    }
  }

  disconnect(playerId: string) {
    if (this.state.handleDisconnect) {
      this.state.handleDisconnect(playerId, this);
    }
  }

  getCurrentState(): string {
    return this.state.constructor.name;
  }

  setState(newState: GameState): void {
    if (this.state) {
      this.state.onExit?.(this);
    }
    this.state = newState;
    newState.onEnter(this);

    this.emitFullGameState();
  }

  private emitFullGameState(): void {
    const stateData = {
      state: this.getCurrentState(),
      players: Array.from(this.players.keys()),
      playerCount: this.players.size,
      history: this.history,
      ready: Object.fromEntries(this.ready.entries()),
      hp: Object.fromEntries(this.hp.entries()),
      roomInfo: {
        id: this.roomId,
        name: this.roomConfig.name,
        maxPlayers: 2,
        currentPlayers: this.players.size,
        isPrivate: this.roomConfig.isPrivate,
      },
      result: this.result,
    };

    this.emit('gameState', stateData);
  }
}

export class WaitingState extends GameState {
  name = 'waiting';
  onEnter(game: Game): void {
    console.log('Entering Waiting State for game in room:', game);
    game.resetAllReady();
  }
  handleJoin(playerId: string, game: Game): void {
    game.players.set(playerId, { id: playerId, socketId: playerId });
    if (!game.hp.has(playerId)) {
      game.setHP(playerId, 100);
    }
  }
  handleMove() {}
  handleDisconnect(playerId: string, game: Game): void {
    game.players.delete(playerId);
    game.clearReady(playerId);
    game.hp.delete(playerId);
    console.log(`Jugador ${playerId} se ha desconectado.`);
  }
}

export class StartingState extends GameState {
  name = 'starting';
  private timerId: NodeJS.Timeout | null = null;
  onEnter(game: Game): void {
    game.resetAllReady();
    for (const playerId of game.players.keys()) {
      game.setHP(playerId, 100);
    }
    let countdown = 3;

    const countdownTick = () => {
      game.emit('countDown', countdown);

      countdown--;

      if (countdown >= 0) {
        this.timerId = setTimeout(countdownTick, 1000);
      } else {
        game.setState(new PlayingState());
      }
    };

    countdownTick();
  }
  handleJoin() {}
  handleMove() {}
  handleDisconnect(playerId: string, game: Game): void {
    game.players.delete(playerId);
    game.clearReady(playerId);
    game.hp.delete(playerId);
    console.log(`Jugador ${playerId} se ha desconectado.`);
  }
  onExit = (): void => {
    if (this.timerId) {
      clearTimeout(this.timerId);
      console.log('Countdown cancelado.');
    }
  };
}

export class PlayingState extends GameState {
  name = 'playing';
  private playersReadyForMatch = new Set<string>();
  private gameStarted = false;
  private tickInterval?: NodeJS.Timeout;
  private readonly ROUND_TIME = 10000;
  private readonly TICK = 100;
  private startTime = 0;
  onEnter(game: Game): void {
    this.playersReadyForMatch.clear();
    console.log(
      `El juego ${game.roomId} está esperando que los clientes carguen la partida.`,
    );
  }
  handlePlayerReady(playerId: string, game: Game): void {
    if (this.gameStarted) return;

    this.playersReadyForMatch.add(playerId);
    console.log(`Jugador ${playerId} ha cargado la partida.`);

    if (
      this.playersReadyForMatch.size === game.players.size &&
      game.players.size === 2
    ) {
      this.startGame(game);
    }
  }

  private startGame(game: Game): void {
    this.gameStarted = true;
    console.log(
      `¡Todos los jugadores listos! Iniciando partida ${game.roomId}.`,
    );

    this.startTime = Date.now();
    game.emit('timerStart', { duration: this.ROUND_TIME });

    this.tickInterval = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      const remaining = Math.max(this.ROUND_TIME - elapsed, 0);

      game.emit('timerTick', { remaining });

      if (remaining <= 0) {
        clearInterval(this.tickInterval);
        this.tickInterval = undefined;
        this.forceMoves(game);
        game.setState(new RevealingState());
      }
    }, this.TICK);
    game.emit('matchStart', {});
  }
  handleJoin() {}

  handleMove(playerId: string, move: Moves, game: Game): void {
    if (!game.players.has(playerId)) {
      console.log('Jugador no reconocido en este juego');
      return;
    }
    game.moves.set(playerId, move);
    if (game.moves.size === 2) {
      if (this.tickInterval) {
        clearInterval(this.tickInterval);
        this.tickInterval = undefined;
      }
      game.setState(new RevealingState());
    }
  }
  handleDisconnect(playerId: string, game: Game): void {
    game.players.delete(playerId);
    game.moves.delete(playerId);
    console.log(
      `Jugador ${playerId} se ha desconectado. Volviendo al estado de espera.`,
    );
    game.setState(new WaitingState());
  }
  private forceMoves(game: Game) {
    for (const playerId of game.players.keys()) {
      if (!game.moves.has(playerId)) {
        const randomMove = getRandomMove();
        game.moves.set(playerId, randomMove);
      }
    }
  }
}

export class RevealingState extends GameState {
  name = 'revealing';
  private readonly ANIMATION_TIME = 6800;
  onEnter(game: Game): void {
    console.log('Entering Revealing State for game in room:', game.roomId);
    this.calculateWinner(game);
  }

  private calculateWinner(game: Game): void {
    const moves = Array.from(game.moves.values());
    const players = Array.from(game.moves.keys());
    if (moves.length < 2) {
      return;
    }

    const [move1, move2] = moves;
    const [player1, player2] = players;

    let damageP1 = 0;
    let damageP2 = 0;
    let roundWinner: string | null = null;

    if (move1 === move2) {
      damageP1 = 5;
      damageP2 = 5;
      roundWinner = null;
    } else if (
      (move1 === Moves.ROCK && move2 === Moves.SCISSORS) ||
      (move1 === Moves.PAPER && move2 === Moves.ROCK) ||
      (move1 === Moves.SCISSORS && move2 === Moves.PAPER)
    ) {
      damageP2 = 20;
      roundWinner = player1;
      console.log('Ganador:', player1, 'con', move1);
    } else {
      damageP1 = 20;
      roundWinner = player2;
      console.log('Ganador:', player2, 'con', move2);
    }
    game.setHP(player1, game.getHP(player1) - damageP1);
    game.setHP(player2, game.getHP(player2) - damageP2);

    if (game.getHP(player1) < 0) {
      game.setHP(player1, 0);
    }
    if (game.getHP(player2) < 0) {
      game.setHP(player2, 0);
    }

    game.history.push({
      round: game.history.length + 1,
      player1Move: move1,
      player2Move: move2,
      winner: roundWinner,
      hpAfter: {
        [player1]: game.getHP(player1),
        [player2]: game.getHP(player2),
      },
    });
    game.emit('roundResult', {
      damage: {
        [player1]: damageP1,
        [player2]: damageP2,
      },
      moves: {
        [player1]: move1,
        [player2]: move2,
      },
      hpAfter: {
        [player1]: game.getHP(player1),
        [player2]: game.getHP(player2),
      },
      winner: roundWinner,
    });

    game.moves.clear();

    if (game.getHP(player1) <= 0 || game.getHP(player2) <= 0) {
      setTimeout(() => {
        game.setState(new FinishedState());
      }, this.ANIMATION_TIME);
    } else {
      setTimeout(() => {
        game.setState(new PlayingState());
        game.emit('roundOver', {});
      }, this.ANIMATION_TIME);
    }
  }
  handleJoin() {}
  handleMove() {}
  handleDisconnect(playerId: string, game: Game): void {
    game.players.delete(playerId);
    console.log(`Jugador ${playerId} se desconectó durante la revelación`);
  }
}

export class FinishedState extends GameState {
  name = 'finished';
  onEnter(game: Game): void {
    const [p1, p2] = Array.from(game.players.keys());
    const hp1 = game.getHP(p1);
    const hp2 = game.getHP(p2);

    let winner: string | null = null;

    if (hp1 <= 0 && hp2 <= 0) {
      winner = null;
    } else if (hp1 <= 0) {
      winner = p2;
    } else if (hp2 <= 0) {
      winner = p1;
    }

    game.result = {
      winner,
      player1: { id: p1, move: game.moves.get(p1) || '' },
      player2: { id: p2, move: game.moves.get(p2) || '' },
    };
    game.emit('gameOver', {
      winner,
      finalHealth: {
        [p1]: hp1,
        [p2]: hp2,
      },
      totalRounds: game.history.length,
    });
  }
  handleJoin() {}
  handleMove() {}
  handleDisconnect(playerId: string, game: Game): void {
    game.players.delete(playerId);
    game.hp.delete(playerId);
    console.log(`Jugador ${playerId} se desconectó del juego terminado`);
  }
}
