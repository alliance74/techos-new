import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

type SocketUser = { userId: string; orgId?: string; email?: string };

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  /** userId -> set of socket ids (supports multiple tabs) */
  private userSockets = new Map<string, Set<string>>();

  constructor(private configService: ConfigService) {}

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken) return authToken;

    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string' && queryToken) return queryToken;

    const header = client.handshake.headers?.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }
    return null;
  }

  private verifyUser(client: Socket): SocketUser | null {
    const token = this.extractToken(client);
    const secret = this.configService.get<string>('JWT_SECRET');
    if (token && secret) {
      try {
        const payload = jwt.verify(token, secret) as {
          sub?: string;
          org_id?: string;
          email?: string;
        };
        if (payload?.sub) {
          return {
            userId: payload.sub,
            orgId: payload.org_id,
            email: payload.email,
          };
        }
      } catch {
        this.logger.warn(`Socket ${client.id} presented an invalid JWT`);
      }
    }

    // Dev fallback: query userId (still prefer JWT when present)
    const queryUserId = client.handshake.query?.userId;
    if (typeof queryUserId === 'string' && queryUserId) {
      return { userId: queryUserId };
    }
    return null;
  }

  handleConnection(client: Socket) {
    const user = this.verifyUser(client);
    if (!user) {
      this.logger.warn(`Rejecting unauthenticated socket ${client.id}`);
      client.disconnect(true);
      return;
    }

    client.data.userId = user.userId;
    client.data.orgId = user.orgId;

    const sockets = this.userSockets.get(user.userId) || new Set<string>();
    sockets.add(client.id);
    this.userSockets.set(user.userId, sockets);

    if (user.orgId) {
      client.join(`org:${user.orgId}`);
    }

    this.logger.log(`User ${user.userId} connected (${client.id})`);
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId as string | undefined;
    if (!userId) return;

    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) this.userSockets.delete(userId);
      else this.userSockets.set(userId, sockets);
    }
    this.logger.log(`User ${userId} disconnected (${client.id})`);
  }

  @SubscribeMessage('joinChannel')
  handleJoinChannel(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.channelId) return { success: false };
    client.join(`channel:${data.channelId}`);
    return { success: true, message: `Joined channel ${data.channelId}` };
  }

  @SubscribeMessage('leaveChannel')
  handleLeaveChannel(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.channelId) return { success: false };
    client.leave(`channel:${data.channelId}`);
    return { success: true, message: `Left channel ${data.channelId}` };
  }

  @SubscribeMessage('joinOrg')
  handleJoinOrg(
    @MessageBody() data: { orgId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const orgId = data?.orgId || client.data?.orgId;
    if (!orgId) return { success: false };
    client.join(`org:${orgId}`);
    return { success: true };
  }

  @SubscribeMessage('joinProject')
  handleJoinProject(
    @MessageBody() data: { projectId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.projectId) return { success: false };
    client.join(`project:${data.projectId}`);
    return { success: true };
  }

  @SubscribeMessage('leaveProject')
  handleLeaveProject(
    @MessageBody() data: { projectId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.projectId) return { success: false };
    client.leave(`project:${data.projectId}`);
    return { success: true };
  }

  sendMessageToChannel(channelId: string, message: any) {
    this.server.to(`channel:${channelId}`).emit('newMessage', message);
  }

  sendNotificationToUser(userId: string, notification: any) {
    const sockets = this.userSockets.get(userId);
    if (!sockets?.size) return;
    sockets.forEach((socketId) => {
      this.server.to(socketId).emit('notification', notification);
    });
  }

  sendNotificationToUsers(userIds: string[], notification: any) {
    userIds.forEach((userId) => this.sendNotificationToUser(userId, notification));
  }

  sendToOrganization(orgId: string, event: string, data: any) {
    this.server.to(`org:${orgId}`).emit(event, data);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { channelId: string; userId?: string; userName: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.userId || data.userId;
    if (!data?.channelId || !userId) return;
    client.to(`channel:${data.channelId}`).emit('userTyping', {
      userId,
      userName: data.userName,
      channelId: data.channelId,
    });
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @MessageBody() data: { channelId: string; userId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.userId || data.userId;
    if (!data?.channelId || !userId) return;
    client.to(`channel:${data.channelId}`).emit('userStoppedTyping', {
      userId,
      channelId: data.channelId,
    });
  }

  sendTaskUpdate(projectId: string, task: any) {
    this.server.to(`project:${projectId}`).emit('taskUpdated', task);
  }

  sendProjectUpdate(orgId: string, project: any) {
    this.server.to(`org:${orgId}`).emit('projectUpdated', project);
  }
}
