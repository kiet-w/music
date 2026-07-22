import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

const getCorsOrigins = () => {
  const origins = process.env.CORS_ORIGINS;
  if (!origins) return '*';
  return origins.split(',').map((o) => o.trim());
};

@WebSocketGateway({
  cors: {
    origin: getCorsOrigins(),
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  // ponytail: instance maps (not static) — reset cleanly on restart
  private readonly userSockets = new Map<string, Set<string>>();
  private readonly userLastSeen = new Map<string, Date>();
  private readonly socketToUser = new Map<string, string>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const userId = this.socketToUser.get(client.id);
    if (!userId) return;

    this.socketToUser.delete(client.id);
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;

    sockets.delete(client.id);
    if (sockets.size === 0) {
      this.userSockets.delete(userId);
      const now = new Date();
      this.userLastSeen.set(userId, now);
      // Broadcast presence change to all clients so friends update status real-time
      this.server.emit('userPresenceChanged', {
        userId,
        isOnline: false,
        lastSeen: now.toISOString(),
      });
    }
  }

  @SubscribeMessage('joinUserRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ) {
    if (!userId || typeof userId !== 'string') return;

    const roomName = `user_${userId}`;
    client.join(roomName);
    this.socketToUser.set(client.id, userId);

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    const sockets = this.userSockets.get(userId)!;
    const wasOffline = sockets.size === 0;
    sockets.add(client.id);

    this.logger.log(`Client ${client.id} joined room: ${roomName}`);

    if (wasOffline) {
      // Broadcast presence change to all clients so friends update status real-time
      this.server.emit('userPresenceChanged', {
        userId,
        isOnline: true,
        lastSeen: null,
      });
    }
  }

  getUserPresence(userId: string) {
    const isOnline = (this.userSockets.get(userId)?.size || 0) > 0;
    const lastSeen = this.userLastSeen.get(userId)?.toISOString() || null;
    return { isOnline, lastSeen };
  }

  emitNewMessage(receiverId: string, message: any) {
    const roomName = `user_${receiverId}`;
    this.server.to(roomName).emit('newMessage', message);
    this.logger.log(`Emitted newMessage to room: ${roomName}`);
  }

  emitFriendRequestAccepted(
    senderId: string,
    receiverId: string,
    friendRequest: any,
  ) {
    this.server.to(`user_${senderId}`).emit('friendRequestAccepted', {
      friendId: receiverId,
      friendRequest,
    });
    this.server.to(`user_${receiverId}`).emit('friendRequestAccepted', {
      friendId: senderId,
      friendRequest,
    });
    this.logger.log(
      `Emitted friendRequestAccepted to user_${senderId} and user_${receiverId}`,
    );
  }

  emitMessageReactionUpdated(
    senderId: string,
    receiverId: string,
    message: any,
  ) {
    this.server.to(`user_${senderId}`).emit('messageReactionUpdated', message);
    this.server.to(`user_${receiverId}`).emit('messageReactionUpdated', message);
    this.logger.log(
      `Emitted messageReactionUpdated to user_${senderId} and user_${receiverId}`,
    );
  }
}
