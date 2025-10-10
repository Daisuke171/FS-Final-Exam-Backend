import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class RoomService {
  private rooms: { [key: string]: { players: string[] } } = {};

  joinRoom(client: Socket, room: string) {
    if (!this.rooms[room]) {
      this.rooms[room] = { players: [] };
    }

    if (
      this.rooms[room].players.length < 2 &&
      !this.rooms[room].players.includes(client.id)
    ) {
      this.rooms[room].players.push(client.id);
      return `Joining room ${room}. Capacity: ${this.rooms[room].players.length}/2`;
    }

    if (this.rooms[room].players.includes(client.id)) {
      return `Already in room ${room}`;
    }

    return `Room ${room} is full`;
  }

  leaveRoom(client: Socket, room: string) {
    if (this.rooms[room] && this.rooms[room].players.includes(client.id)) {
      this.rooms[room].players = this.rooms[room].players.filter(
        (id) => id !== client.id,
      );
      return `Left room ${room}. Capacity: ${this.rooms[room].players.length}/2`;
    }
    return `Not in room ${room}`;
  }

  leaveAllRooms(client: Socket) {
    Object.keys(this.rooms).forEach((room) => {
      this.leaveRoom(client, room);
    });
    return `Left all rooms`;
  }

  getUsersInRoom(room: string) {
    return this.rooms[room];
  }

  getUserInAllRooms(client: Socket) {
    return Object.keys(this.rooms).filter((room) =>
      this.rooms[room].players.includes(client.id),
    );
  }
}
