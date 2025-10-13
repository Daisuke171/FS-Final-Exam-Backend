export interface Player {
  id: string;
  socketId: string;
}

export interface RoomConfig {
  name: string;
  isPrivate: boolean;
  password?: string;
}

export class Game {
  // Up to 2 active players; extra connections become spectators
  public players: Map<string, Player> = new Map();
  public spectators: Set<string> = new Set();
  public readyPlayers: Set<string> = new Set();
  public roomId: string;
  public roomConfig: RoomConfig;
  private emitCallback?: (event: string, data: any) => void;
  private onRoomEmpty?: (roomId: string) => void;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(roomId: string, roomConfig: RoomConfig) {
    this.roomId = roomId;
    this.roomConfig = roomConfig;
  }

  setOnRoomEmptyCallback(callback: (roomId: string) => void) {
    this.onRoomEmpty = callback;
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

  setEmitCallback(cb: (event: string, data: any) => void) {
    this.emitCallback = cb;
  }

  emit(event: string, data: any) {
    if (this.emitCallback) {
      this.emitCallback(event, data);
    }
  }

  join(playerId: string): 'player' | 'spectator' {
    this.cancelCleanupTimer();
    if (this.players.size < 2) {
      this.players.set(playerId, { id: playerId, socketId: playerId });
      return 'player';
    } else {
      this.spectators.add(playerId);
      return 'spectator';
    }
  }

  disconnect(playerId: string) {
    if (this.players.has(playerId)) {
      this.players.delete(playerId);
      this.readyPlayers.delete(playerId);
    } else {
      this.spectators.delete(playerId);
    }
    if (this.players.size === 0 && this.spectators.size === 0) {
      this.startCleanupTimer();
    }
  }

  cleanup() {
    this.cancelCleanupTimer();
  }

  getCurrentState(): string {
    if (this.players.size === 2 && this.readyPlayers.size === 2) {
      return 'ReadyState';
    }
    return 'WaitingState';
  }

  confirmReady(playerId: string, ready: boolean) {
    if (!this.players.has(playerId)) return; // spectators can't ready up
    if (ready) this.readyPlayers.add(playerId);
    else this.readyPlayers.delete(playerId);
  }
}
