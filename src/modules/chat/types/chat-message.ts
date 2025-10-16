import * as uuid from 'uuid';

export type statusType = 'sended' | 'pending' | 'read';

export interface IChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  message: string;
  status: statusType;
  read: boolean;
  timestamp: Date;
}

class ChatMessageClass {
  id: string;
  chatId: string;
  senderId: string;
  message: string;
  status: statusType;
  read: boolean;
  timestamp: Date;

  constructor(id: string, chatId: string, senderId: string, message: string, status: statusType, read: boolean, timestamp: Date) {
    this.id = id;
    this.chatId = chatId;
    this.senderId = senderId;
    this.message = message;
    this.status = status;
    this.read = read;
    this.timestamp = timestamp;
  }

    static fromJson(json: IChatMessage): ChatMessageClass {
        return new ChatMessageClass(
            json.id,
            json.chatId,
            json.senderId,
            json.message,
            json.status,
            json.read,
            json.timestamp
        );
    }

    toJson(): IChatMessage {
        return {
            id: this.id,
            chatId: this.chatId,
            senderId: this.senderId,
            message: this.message,
            status: this.status,
            read: this.read,
            timestamp: this.timestamp
        };
    }

    toString(): string {
        return JSON.stringify(this.toJson());
    }

    static fromString(jsonString: string): ChatMessageClass {
        return ChatMessageClass.fromJson(JSON.parse(jsonString));
    }

    createId(): string {
        // crea id con uuid
         return 'chatMessage' + uuid.v4();
    }

}

export default ChatMessageClass;