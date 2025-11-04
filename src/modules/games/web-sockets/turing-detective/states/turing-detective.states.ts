import { GamesService } from 'src/modules/games/games.service';
import { UserService } from '@modules/user/user.service';

export abstract class GameState {
  abstract handleJoin(playerId: string, game: Game): void;
  abstract handleDisconnect(playerId: string, game: Game): void;
  abstract onEnter(game: Game);
  onExit?: (game: Game) => void;
}

export interface Player {
  id: string;
  socketId: string;
}

export interface RoomConfig {
  name: string;
  isPrivate: boolean;
  password?: string;
}

export interface GameResult {
  winner?: string | null;
  finalScores: Record<string, number>;
}

export class Game {
  private state: GameState;
  public players: Map<string, Player> = new Map();
  public roomId: string;
  public roomConfig: RoomConfig;

  // Typing game specific
  public scores: Map<string, number> = new Map();
  public problemIndex: Map<string, number> = new Map();

  // Kept for gateway compatibility with buildStateData
  public history: unknown[] = [];
  public result?: GameResult;
  public ready: Map<string, boolean> = new Map();
  public playerUserIds: Map<string, string> = new Map();
  public startTime: number = Date.now();

  private emitCallback?: (event: string, data: any) => void;
  private onRoomEmpty?: (roomId: string) => void;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(
    roomId: string,
    roomConfig: RoomConfig,
    initialState: GameState,
    private readonly _gamesApiService: GamesService,
    private readonly _usersService: UserService,
  ) {
    this.roomId = roomId;
    this.roomConfig = roomConfig;
    this.state = initialState;
    this.state.onEnter?.(this);
  }

  // Wiring helpers
  setOnRoomEmptyCallback(callback: (roomId: string) => void) {
    this.onRoomEmpty = callback;
  }
  setEmitCallback(cb: (event: string, data: any) => void) {
    this.emitCallback = cb;
  }
  emit(event: string, data: any) {
    this.emitCallback?.(event, data);
  }
  getGamesApiService(): GamesService {
    return this._gamesApiService;
  }
  getUsersService(): UserService {
    return this._usersService;
  }
  cleanup() {
    this.cancelCleanupTimer();
  }

  // Join/leave
  join(playerId: string) {
    this.cancelCleanupTimer();
    this.state.handleJoin(playerId, this);
  }
  disconnect(playerId: string) {
    this.state.handleDisconnect(playerId, this);
    if (this.players.size === 0) this.startCleanupTimer();
  }

  // Ready system (kept from RPS for flow reuse)
  setReady(playerId: string, isReady: boolean) {
    this.ready.set(playerId, isReady);
  }
  clearReady(playerId: string) {
    this.ready.delete(playerId);
  }
  isAllReady(): boolean {
    if (this.players.size < 2) return false;
    for (const id of this.players.keys()) if (!this.ready.get(id)) return false;
    return true;
  }
  resetAllReady() {
    this.ready.clear();
  }

  // Typing: score operations for future use
  addScore(playerId: string, points: number) {
    const current = this.scores.get(playerId) ?? 0;
    this.scores.set(playerId, current + points);
    this.emitFullGameState();
  }

  // State handling
  getCurrentState(): string {
    return this.state.constructor.name;
  }
  setState(newState: GameState) {
    this.state.onExit?.(this);
    this.state = newState;
    newState.onEnter(this);
    this.emitFullGameState();
  }

  private emitFullGameState() {
    const stateData = {
      state: this.getCurrentState(),
      players: Array.from(this.players.keys()),
      playerCount: this.players.size,
      history: this.history,
      ready: Object.fromEntries(this.ready.entries()),
      // Provide both scores (new) and hp/moves for compat with existing gateway
      scores: Object.fromEntries(this.scores.entries()),
      problemIndex: Object.fromEntries(this.problemIndex.entries()),
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

  // Timers
  private cancelCleanupTimer() {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
  private startCleanupTimer() {
    this.cancelCleanupTimer();
    this.cleanupTimer = setTimeout(() => {
      if (this.players.size === 0) this.onRoomEmpty?.(this.roomId);
    }, 5000);
  }
}

export class WaitingState extends GameState {
  onEnter(game: Game): void {
    game.resetAllReady();
  }
  handleJoin(playerId: string, game: Game): void {
    game.players.set(playerId, { id: playerId, socketId: playerId });
    if (!game.scores.has(playerId)) game.scores.set(playerId, 0);
    if (!game.problemIndex.has(playerId)) game.problemIndex.set(playerId, 0);
  }
  handleMove(): void {}
  handleDisconnect(playerId: string, game: Game): void {
    game.players.delete(playerId);
    game.clearReady(playerId);
    game.scores.delete(playerId);
    game.problemIndex.delete(playerId);
  }
}

export class StartingState extends GameState {
  private timerId: NodeJS.Timeout | null = null;
  onEnter(game: Game): void {
    game.resetAllReady();
    let countdown = 3;
    const tick = () => {
      game.emit('countDown', countdown);
      countdown--;
      if (countdown >= 0) this.timerId = setTimeout(tick, 1000);
      else game.setState(new PlayingState());
    };
    tick();
  }
  handleJoin(): void {}
  handleMove(): void {}
  handleDisconnect(playerId: string, game: Game): void {
    game.players.delete(playerId);
    game.clearReady(playerId);
    game.scores.delete(playerId);
  }
  onExit = () => {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  };
}

export class PlayingState extends GameState {
  private playersReadyForMatch = new Set<string>();
  private gameStarted = false;
  private tickInterval?: NodeJS.Timeout;
  private readonly ROUND_TIME = 60000; // 60s typing battle
  private readonly TICK = 100; // 100ms updates
  private startTime = 0;

  onEnter(game: Game): void {
    this.playersReadyForMatch.clear();
    // Wait for both clients to signal they're ready to start
    // Reference param to satisfy lint
    void game;
  }

  // Called from gateway on 'playerReadyForMatch'
  handlePlayerReady(playerId: string, game: Game): void {
    if (this.gameStarted) return;
    this.playersReadyForMatch.add(playerId);
    if (
      this.playersReadyForMatch.size === game.players.size &&
      game.players.size === 2
    ) {
      this.startGame(game);
    }
  }

  private startGame(game: Game) {
    this.gameStarted = true;
    this.startTime = Date.now();
    game.startTime = this.startTime;
    game.emit('timerStart', { duration: this.ROUND_TIME });
    game.emit('matchStart', {});

    this.tickInterval = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      const remaining = Math.max(this.ROUND_TIME - elapsed, 0);
      game.emit('timerTick', { remaining });
      if (remaining <= 0) {
        if (this.tickInterval) clearInterval(this.tickInterval);
        this.tickInterval = undefined;
        game.setState(new FinishedState());
      }
    }, this.TICK);
  }

  handleJoin(): void {}
  handleMove(): void {}
  handleDisconnect(playerId: string, game: Game): void {
    game.players.delete(playerId);
    // If someone leaves mid-match, end and evaluate winner
    if (game.players.size < 2) {
      if (this.tickInterval) clearInterval(this.tickInterval);
      this.tickInterval = undefined;
      game.setState(new FinishedState());
    }
  }
}

export class FinishedState extends GameState {
  private readonly GAME_NAME = 'Turing Detective';
  async onEnter(game: Game) {
    // Decide winner by higher score; tie allowed
    const [p1, p2] = Array.from(game.players.keys());
    const s1 = p1 ? (game.scores.get(p1) ?? 0) : 0;
    const s2 = p2 ? (game.scores.get(p2) ?? 0) : 0;

    let winner: string | null = null;
    if (p1 && p2) {
      winner = s1 === s2 ? null : s1 > s2 ? p1 : p2;
    } else if (p1) {
      winner = p1;
    } else if (p2) {
      winner = p2;
    }

    game.result = {
      winner,
      finalScores: Object.fromEntries(game.scores.entries()),
    };

    // Persist results and XP similar to RPS
    try {
      const gamesApiService = game.getGamesApiService();
      const usersService = game.getUsersService();
      const duration = Math.floor((Date.now() - game.startTime) / 1000);

      const userId1 = p1 ? game.playerUserIds.get(p1) : undefined;
      const userId2 = p2 ? game.playerUserIds.get(p2) : undefined;

      if (p1 && userId1) {
        const state1 =
          winner === p1 ? 'won' : winner === null ? 'draw' : 'lost';
        const score1 = Math.round(s1);
        await gamesApiService.saveGameResult(
          {
            gameName: this.GAME_NAME,
            duration,
            state: state1 as any,
            score: score1,
            totalDamage: 0,
          },
          userId1,
        );
        const xp1 = this.calculateXpFromScore(score1, state1 === 'won');
        await usersService.addExperience(userId1, xp1);
      }
      if (p2 && userId2) {
        const state2 =
          winner === p2 ? 'won' : winner === null ? 'draw' : 'lost';
        const score2 = Math.round(s2);
        await gamesApiService.saveGameResult(
          {
            gameName: this.GAME_NAME,
            duration,
            state: state2 as any,
            score: score2,
            totalDamage: 0,
          },
          userId2,
        );
        const xp2 = this.calculateXpFromScore(score2, state2 === 'won');
        await usersService.addExperience(userId2, xp2);
      }
    } catch (err) {
      console.error('Error saving Coding War result:', err);
    }

    game.emit('gameOver', {
      winner,
      finalScores: Object.fromEntries(game.scores.entries()),
    });

    // After a short delay, reset room so players can replay without recreating the room
    setTimeout(() => {
      // Reset scores and per-player progression for a fresh start
      game.scores.clear();
      for (const id of game.players.keys()) {
        game.scores.set(id, 0);
      }
      game.problemIndex.clear();
      for (const id of game.players.keys()) {
        game.problemIndex.set(id, 0);
      }
      // Keep last result on the object for any UI that wants to show it on the room screen
      // Transition back to Waiting so joinRoom and ready flow work again
      game.setState(new WaitingState());
    }, 1500);
  }
  private calculateXpFromScore(score: number, won: boolean): number {
    const baseXp = 10;
    const performanceXp = Math.max(0, Math.floor(score / 2));
    const winBonus = won ? 20 : 0;
    const completionBonus = 5;
    const total = baseXp + performanceXp + winBonus + completionBonus;
    return Math.max(10, Math.min(85, total));
  }
  handleJoin(): void {}
  handleMove(): void {}
  handleDisconnect(playerId: string, game: Game): void {
    game.players.delete(playerId);
    game.scores.delete(playerId);
  }
}
