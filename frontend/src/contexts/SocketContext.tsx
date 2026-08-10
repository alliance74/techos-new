'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { isRealtimeEnabled, socketClient } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  joinChannel: (channelId: string) => void;
  leaveChannel: (channelId: string) => void;
  sendTyping: (channelId: string, userName: string) => void;
  stopTyping: (channelId: string) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  joinChannel: () => {},
  leaveChannel: () => {},
  sendTyping: () => {},
  stopTyping: () => {},
});

export function useSocket() {
  return useContext(SocketContext);
}

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user?.id || !isRealtimeEnabled()) {
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const connectedSocket = socketClient.connect(user.id);
    if (!connectedSocket) {
      setSocket(null);
      setIsConnected(false);
      return;
    }

    setSocket(connectedSocket);

    const handleConnect = () => {
      setIsConnected(true);
      const orgId = (user as any).org_id || (user as any).orgId;
      if (orgId) socketClient.joinOrg(orgId);
    };
    const handleDisconnect = () => setIsConnected(false);
    const handleNotification = (notification: {
      message?: string;
      title?: string;
      type?: 'error' | 'success' | 'warning' | string;
    }) => {
      toast(notification.message || notification.title || 'New notification', {
        icon:
          notification.type === 'error'
            ? '❌'
            : notification.type === 'success'
              ? '✅'
              : notification.type === 'warning'
                ? '⚠️'
                : 'ℹ️',
      });
    };

    connectedSocket.on('connect', handleConnect);
    connectedSocket.on('disconnect', handleDisconnect);
    connectedSocket.on('notification', handleNotification);
    if (connectedSocket.connected) handleConnect();

    return () => {
      connectedSocket.off('connect', handleConnect);
      connectedSocket.off('disconnect', handleDisconnect);
      connectedSocket.off('notification', handleNotification);
      socketClient.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user?.id, (user as any)?.org_id, (user as any)?.orgId]);

  const joinChannel = useCallback((channelId: string) => {
    socketClient.joinChannel(channelId);
  }, []);

  const leaveChannel = useCallback((channelId: string) => {
    socketClient.leaveChannel(channelId);
  }, []);

  const sendTyping = useCallback(
    (channelId: string, userName: string) => {
      if (user?.id) {
        socketClient.sendTyping(channelId, user.id, userName);
      }
    },
    [user?.id],
  );

  const stopTyping = useCallback(
    (channelId: string) => {
      if (user?.id) {
        socketClient.stopTyping(channelId, user.id);
      }
    },
    [user?.id],
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinChannel,
        leaveChannel,
        sendTyping,
        stopTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
