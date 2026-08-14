'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/contexts/SocketContext';

type LiveMessage = {
  id: string;
  channel_id?: string;
  channelId?: string;
  content?: string;
  user_id?: string;
  userId?: string;
  created_at?: string;
  event?: string;
  [key: string]: unknown;
};

type TypingUser = {
  userId: string;
  userName: string;
  channelId?: string;
};

function messageChannelId(message: LiveMessage) {
  return message.channel_id || message.channelId || '';
}

/** Join channel room and keep React Query messages cache live. */
export function useRealtimeMessages(channelId?: string) {
  const { socket, isConnected, joinChannel, leaveChannel } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected || !channelId) return;

    joinChannel(channelId);

    const handleNewMessage = (message: LiveMessage) => {
      if (messageChannelId(message) !== channelId) return;

      // Thread replies belong in the thread panel, not the main feed
      if (message.parent_message_id) {
        queryClient.invalidateQueries({
          queryKey: ['messages', message.parent_message_id, 'thread'],
        });
        queryClient.invalidateQueries({ queryKey: ['channels', channelId, 'messages'] });
        return;
      }

      // Reaction / edit / delete envelopes still use newMessage + event field
      if (message.event && message.event !== 'created') {
        queryClient.invalidateQueries({ queryKey: ['channels', channelId, 'messages'] });
        return;
      }

      queryClient.setQueryData(['channels', channelId, 'messages'], (old: any) => {
        const list = Array.isArray(old) ? old : [];
        if (list.some((m: any) => m.id === message.id)) return list;
        return [...list, message];
      });
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
      leaveChannel(channelId);
    };
  }, [socket, isConnected, channelId, joinChannel, leaveChannel, queryClient]);
}

export function useTypingIndicators(channelId?: string) {
  const { socket, isConnected } = useSocket();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    if (!socket || !isConnected || !channelId) return;

    const handleUserTyping = (data: TypingUser) => {
      if (data.channelId && data.channelId !== channelId) return;
      setTypingUsers((prev) => {
        const filtered = prev.filter((u) => u.userId !== data.userId);
        return [...filtered, data];
      });
      window.setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      }, 3000);
    };

    const handleUserStoppedTyping = (data: { userId: string; channelId?: string }) => {
      if (data.channelId && data.channelId !== channelId) return;
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    };

    socket.on('userTyping', handleUserTyping);
    socket.on('userStoppedTyping', handleUserStoppedTyping);

    return () => {
      socket.off('userTyping', handleUserTyping);
      socket.off('userStoppedTyping', handleUserStoppedTyping);
    };
  }, [socket, isConnected, channelId]);

  return typingUsers;
}

export function useRealtimeNotifications() {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    };

    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, isConnected, queryClient]);
}

export function useTyping(channelId?: string, userName?: string) {
  const { sendTyping, stopTyping } = useSocket();
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTyping = useCallback(() => {
    if (!channelId || !userName) return;

    if (!isTyping) {
      setIsTyping(true);
      sendTyping(channelId, userName);
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(channelId);
    }, 2000);
  }, [channelId, userName, isTyping, sendTyping, stopTyping]);

  const handleStopTyping = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isTyping && channelId) {
      setIsTyping(false);
      stopTyping(channelId);
    }
  }, [isTyping, channelId, stopTyping]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { handleTyping, handleStopTyping };
}
