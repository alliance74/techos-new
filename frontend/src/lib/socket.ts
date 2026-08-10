import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

/** Realtime on by default in development; set NEXT_PUBLIC_ENABLE_WS=false to disable. */
export const isRealtimeEnabled = () => {
  if (process.env.NEXT_PUBLIC_ENABLE_WS === 'false') return false;
  if (process.env.NEXT_PUBLIC_ENABLE_WS === 'true') return true;
  return process.env.NODE_ENV !== 'production';
};

function readAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || localStorage.getItem('auth_token');
}

class SocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 8;
  private gaveUpLogged = false;

  connect(userId?: string): Socket | null {
    if (!isRealtimeEnabled()) {
      return null;
    }

    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.socket) {
      return this.socket;
    }

    const token = readAuthToken();

    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      auth: token ? { token } : undefined,
      query: {
        ...(userId ? { userId } : {}),
        ...(token ? { token } : {}),
      },
    });

    this.setupEventListeners();
    return this.socket;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.gaveUpLogged = false;
    });

    this.socket.on('disconnect', () => {
      // callers use isConnected from context
    });

    this.socket.on('connect_error', () => {
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts && !this.gaveUpLogged) {
        this.gaveUpLogged = true;
        console.warn(
          `[socket] Could not reach ${WS_URL}. Ensure Nest is running and JWT is present.`,
        );
      }
    });

    this.socket.on('reconnect', () => {
      this.reconnectAttempts = 0;
      this.gaveUpLogged = false;
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  emit(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  joinChannel(channelId: string) {
    this.emit('joinChannel', { channelId });
  }

  leaveChannel(channelId: string) {
    this.emit('leaveChannel', { channelId });
  }

  joinOrg(orgId: string) {
    this.emit('joinOrg', { orgId });
  }

  sendTyping(channelId: string, userId: string, userName: string) {
    this.emit('typing', { channelId, userId, userName });
  }

  stopTyping(channelId: string, userId: string) {
    this.emit('stopTyping', { channelId, userId });
  }
}

export const socketClient = new SocketClient();

export default socketClient;
