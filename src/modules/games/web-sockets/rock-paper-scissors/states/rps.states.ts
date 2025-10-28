import { UserService } from '@modules/user/user.service';
import { getRandomMove } from '../utils/getRandomMove';
import { GamesService } from '@modules/games/games.service';
import { getNextLevel } from '../utils/getNextLevel';

export enum Moves {
  ROCK = 'piedra',
  PAPER = 'papel',
  SCISSORS = 'tijera',
}

export abstract class GameState {
  abstract handleJoin(playerId: string, game: Game): void;
  abstract handleMove(playerId: string, move: Moves, game: Game): void;
  abstract handleDisconnect(playerId: string, game: Game): void;
  abstract onEnter(game: Game);
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
  private onRoomEmpty?: (roomId: string) => void;
  private cleanupTimer?: NodeJS.Timeout;
  public playerUserIds: Map<string, string> = new Map();
  public isFinished: boolean = false;
  damageDealt: Map<string, number> = new Map();
  startTime: number = Date.now();

  constructor(
    roomId: string,
    roomConfig: RoomConfig,
    initialState: GameState,
    private gamesApiService: GamesService,
    private usersService: UserService,
  ) {
    this.roomId = roomId;
    this.roomConfig = roomConfig;
    this.state = initialState;
    if (this.state.onEnter) {
      this.state.onEnter(this);
    }
  }

  setOnRoomEmptyCallback(callback: (roomId: string) => void) {
    this.onRoomEmpty = callback;
  }

  getGamesApiService(): GamesService {
    return this.gamesApiService;
  }

  getUsersService(): UserService {
    return this.usersService;
  }

  recordDamage(playerId: string, damage: number) {
    const current = this.damageDealt.get(playerId) || 0;
    this.damageDealt.set(playerId, current + damage);
  }

  private cancelCleanupTimer() {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
  private startCleanupTimer() {
    this.cancelCleanupTimer();
    this.cleanupTimer = setTimeout(() => {
      if (this.players.size === 0) {
        if (this.onRoomEmpty) {
          this.onRoomEmpty(this.roomId);
        }
      }
    }, 5000);
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
    this.cancelCleanupTimer();
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
    if (this.players.size === 0) {
      this.startCleanupTimer();
    }
  }
  cleanup() {
    this.cancelCleanupTimer();
  }

  getCurrentState(): string {
    return this.state.constructor.name;
  }

  setState(newState: GameState): void {
    if (
      this.isFinished &&
      !(newState instanceof FinishedState) &&
      !(newState instanceof StartingState)
    ) {
      console.log(
        `⚠️ Intento de cambiar a ${newState.constructor.name} después de finalizar, ignorando`,
      );
      return;
    }

    if (this.state) {
      this.state.onExit?.(this);
    }

    this.state = newState;

    if (newState instanceof FinishedState) {
      this.isFinished = true;
    }

    if (newState instanceof StartingState && this.isFinished) {
      console.log('♻️ Reiniciando juego desde FinishedState');
      this.isFinished = false;
    }

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
    game.moves.clear();
    game.history = [];
    game.damageDealt.clear();
    game.startTime = Date.now();

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
    this.gameStarted = false;
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
      game.recordDamage(player1, 5);
      game.recordDamage(player2, 5);
      roundWinner = null;
    } else if (
      (move1 === Moves.ROCK && move2 === Moves.SCISSORS) ||
      (move1 === Moves.PAPER && move2 === Moves.ROCK) ||
      (move1 === Moves.SCISSORS && move2 === Moves.PAPER)
    ) {
      damageP2 = 20;
      game.recordDamage(player2, 20);
      roundWinner = player1;
      console.log('Ganador:', player1, 'con', move1);
    } else {
      damageP1 = 20;
      game.recordDamage(player1, 20);
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
  async onEnter(game: Game) {
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
    const gamesApiService = game.getGamesApiService();
    const usersService = game.getUsersService();
    const duration = Math.floor((Date.now() - game.startTime) / 1000);

    const userId1 = game.playerUserIds.get(p1);
    const userId2 = game.playerUserIds.get(p2);

    if (!userId1 || !userId2) {
      console.error(
        'Error: No se encontró userId para alguno de los jugadores',
      );
      game.emit('gameOver', {
        winner: null,
        error: 'No se pudo guardar la partida',
      });
      return;
    }

    const gameId = process.env.RPS_ID || 'rps-id-2';
    const maxHp = 100;
    let player1Score: number | null = null;
    let player2Score: number | null = null;

    try {
      player1Score = this.calculateScore(
        hp1,
        hp2,
        game.history.length,
        winner === p1,
        maxHp,
      );

      player2Score = this.calculateScore(
        hp2,
        hp1,
        game.history.length,
        winner === p2,
        maxHp,
      );

      const player1Xp = this.calculateXpFromScore(player1Score, winner === p1);
      const player2Xp = this.calculateXpFromScore(player2Score, winner === p2);

      await gamesApiService.saveGameResult(
        {
          gameId: gameId,
          duration,
          state: winner === p1 ? 'won' : winner === null ? 'draw' : 'lost',
          score: player1Score,
          totalDamage: game.damageDealt.get(p1) || 0,
        },
        userId1,
      );

      await gamesApiService.saveGameResult(
        {
          gameId: gameId,
          duration,
          state: winner === p2 ? 'won' : winner === null ? 'draw' : 'lost',
          score: player2Score,
          totalDamage: game.damageDealt.get(p2) || 0,
        },
        userId2,
      );

      const user1Before = await usersService.getUserWithLevel(userId1);
      const user2Before = await usersService.getUserWithLevel(userId2);

      const player1XpResult = await usersService.addExperience(
        userId1,
        player1Xp,
      );

      const player2XpResult = await usersService.addExperience(
        userId2,
        player2Xp,
      );

      const player1LevelData = this.calculateLevelData(
        user1Before,
        player1XpResult,
        player1Xp,
      );

      const player2LevelData = this.calculateLevelData(
        user2Before,
        player2XpResult,
        player2Xp,
      );

      game.emit('gameOver', {
        winner,
        finalHealth: {
          [p1]: hp1,
          [p2]: hp2,
        },
        totalRounds: game.history.length,
        scores: {
          [p1]: player1Score,
          [p2]: player2Score,
        },
        experienceResults: {
          [p1]: player1LevelData,
          [p2]: player2LevelData,
        },
      });
    } catch (error) {
      console.error('Error al guardar el resultado de la partida:', error);
    }
  }

  private calculateLevelData(userBefore: any, xpResult: any, xpGained: number) {
    const currentLevelXpRequired = userBefore.level.experienceRequired;
    const experienceBefore = userBefore.experience;
    const experienceAfter = xpResult.user.experience;

    const xpInCurrentLevelBefore = experienceBefore - currentLevelXpRequired;

    const nextLevel = getNextLevel(userBefore.level.atomicNumber + 1);
    const nextLevelXpRequired = nextLevel?.experienceRequired || 99999;

    const xpNeededForLevel = nextLevelXpRequired - currentLevelXpRequired;
    const progressBefore = (xpInCurrentLevelBefore / xpNeededForLevel) * 100;

    if (xpResult.leveledUp) {
      const newLevelXpRequired = xpResult.user.level.experienceRequired;
      const xpInNewLevel = experienceAfter - newLevelXpRequired;
      const nextNextLevel = getNextLevel(xpResult.newLevel + 1);
      const xpNeededForNewLevel =
        (nextNextLevel?.experienceRequired || 99999) - newLevelXpRequired;
      const progressAfter = (xpInNewLevel / xpNeededForNewLevel) * 100;

      return {
        xpGained,
        leveledUp: true,
        oldLevel: xpResult.previousLevel,
        newLevel: xpResult.newLevel,
        unlockedSkins: xpResult.unlockedSkins || [],

        xpInCurrentLevelBefore,
        xpNeededForLevelBefore: xpNeededForLevel,
        progressBefore,

        xpInCurrentLevelAfter: xpInNewLevel,
        xpNeededForLevelAfter: xpNeededForNewLevel,
        progressAfter,

        oldLevelName: userBefore.level.name,
        oldLevelSymbol: userBefore.level.chemicalSymbol,
        oldLevelColor: userBefore.level.color,

        newLevelName: xpResult.user.level.name,
        newLevelSymbol: xpResult.user.level.chemicalSymbol,
        newLevelColor: xpResult.user.level.color,
      };
    } else {
      const xpInCurrentLevelAfter = experienceAfter - currentLevelXpRequired;
      const progressAfter = (xpInCurrentLevelAfter / xpNeededForLevel) * 100;

      return {
        xpGained,
        leveledUp: false,
        oldLevel: xpResult.newLevel,
        newLevel: xpResult.newLevel,
        unlockedSkins: [],

        xpInCurrentLevelBefore,
        xpInCurrentLevelAfter,
        xpNeededForLevel,
        progressBefore,
        progressAfter,

        oldLevelName: userBefore.level.name,
        oldLevelSymbol: userBefore.level.chemicalSymbol,
        oldLevelColor: userBefore.level.color,
        newLevelName: userBefore.level.name,
        newLevelSymbol: userBefore.level.chemicalSymbol,
        newLevelColor: userBefore.level.color,
      };
    }
  }

  private calculateScore(
    playerHp: number,
    opponentHp: number,
    rounds: number,
    won: boolean,
    maxHp: number = 100,
  ): number {
    const playerHpPercent = (playerHp / maxHp) * 100;
    const opponentHpPercent = (opponentHp / maxHp) * 100;
    const damageDealtPercent = 100 - opponentHpPercent;

    if (won) {
      // GANADOR: puede ganar entre 5 y 50 puntos
      const hpScore = (playerHpPercent / 100) * 30;
      const speedScore = Math.max(0, 15 - rounds);
      const winBonus = 5;

      const totalScore = hpScore + speedScore + winBonus;
      return Math.min(50, Math.round(totalScore));
    } else {
      // PERDEDOR: SIEMPRE pierde puntos (entre -5 y -40)
      const damageScore = (damageDealtPercent / 100) * 15; // Reducido de 25 a 15
      const resistanceScore = Math.max(0, 10 - Math.floor(rounds / 2));

      // Penalización base por perder
      const lossPenalty = -20;

      // Si hizo buen daño, pierde menos
      if (damageDealtPercent >= 50) {
        const totalScore = lossPenalty + (damageScore + resistanceScore) * 0.5; // 50% del bono
        return Math.max(-5, Math.round(totalScore)); // Pierde mínimo 5
      }

      // Si hizo algo de daño
      if (damageDealtPercent > 0) {
        const totalScore = lossPenalty + (damageScore + resistanceScore) * 0.3; // 30% del bono
        return Math.max(-15, Math.round(totalScore)); // Pierde entre 5 y 15
      }

      // Si no hizo nada de daño
      return Math.max(-40, lossPenalty - rounds * 2); // Pierde entre 20 y 40
    }
  }
  private calculateXpFromScore(score: number, won: boolean): number {
    const baseXp = 10;

    const performanceXp = Math.max(0, score);

    const winBonus = won ? 20 : 0;

    const completionBonus = 5;

    const totalXp = baseXp + performanceXp + winBonus + completionBonus;

    return Math.max(10, Math.min(85, totalXp));
  }
  handleJoin() {}
  handleMove() {}
  handleDisconnect(playerId: string, game: Game): void {
    game.players.delete(playerId);
    game.hp.delete(playerId);
    console.log(`Jugador ${playerId} se desconectó del juego terminado`);
    if (game.players.size === 0) {
      console.log(
        `🗑️ Todos los jugadores se desconectaron, eliminando juego ${game.roomId}`,
      );
      if (game['onRoomEmpty']) {
        game['onRoomEmpty'](game.roomId);
      }
    }
  }
}
