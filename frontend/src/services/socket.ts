import { io, Socket } from 'socket.io-client';
import { ChatMessage, PomodoroSession } from '../types';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => {
  return socket;
};

export const connectSocket = (): Socket => {
  if (socket && socket.connected) {
    return socket;
  }

  const token = localStorage.getItem('access_token');

  const wsTarget = import.meta.env.VITE_WS_URL || window.location.origin;

  socket = io(wsTarget, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: {
      token: token ? `Bearer ${token}` : '',
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    // Connected to socket
  });

  socket.on('connect_error', (error) => {
    console.warn('Socket connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    // Disconnected socket
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinPodRoom = (podId: string): void => {
  const s = socket || connectSocket();
  s.emit('join_room', { pod_id: podId });
};

export const leavePodRoom = (podId: string): void => {
  if (socket) {
    socket.emit('leave_room', { pod_id: podId });
  }
};

export const sendMessage = (podId: string, content: string): void => {
  const s = socket || connectSocket();
  s.emit('send_message', { pod_id: podId, content });
};

export const sendTyping = (podId: string): void => {
  const s = socket || connectSocket();
  s.emit('typing', { pod_id: podId });
};

export const startPomodoro = (podId: string, duration: number, breakTime: number): void => {
  const s = socket || connectSocket();
  s.emit('pomodoro_start', {
    pod_id: podId,
    duration_minutes: duration,
    break_minutes: breakTime,
  });
};

export const joinPomodoro = (sessionId: string): void => {
  const s = socket || connectSocket();
  s.emit('pomodoro_join', { session_id: sessionId });
};

// Event Listeners with cleanup functions
export const onMessage = (callback: (message: ChatMessage) => void): (() => void) => {
  const s = socket || connectSocket();
  const handler = (data: ChatMessage) => callback(data);
  s.on('new_message', handler);
  s.on('message', handler);
  return () => {
    s.off('new_message', handler);
    s.off('message', handler);
  };
};

export const onTyping = (callback: (data: { user_id: string; username: string }) => void): (() => void) => {
  const s = socket || connectSocket();
  const handler = (data: { user_id: string; username: string }) => callback(data);
  s.on('user_typing', handler);
  s.on('typing', handler);
  return () => {
    s.off('user_typing', handler);
    s.off('typing', handler);
  };
};

export const onPomodoroStarted = (callback: (session: PomodoroSession) => void): (() => void) => {
  const s = socket || connectSocket();
  const handler = (session: PomodoroSession) => callback(session);
  s.on('pomodoro_started', handler);
  return () => {
    s.off('pomodoro_started', handler);
  };
};

export const onPomodoroTick = (callback: (data: { remaining_seconds: number; session_id: string }) => void): (() => void) => {
  const s = socket || connectSocket();
  const handler = (data: { remaining_seconds: number; session_id: string }) => callback(data);
  s.on('pomodoro_tick', handler);
  return () => {
    s.off('pomodoro_tick', handler);
  };
};

export const onPomodoroCompleted = (callback: (session: PomodoroSession) => void): (() => void) => {
  const s = socket || connectSocket();
  const handler = (session: PomodoroSession) => callback(session);
  s.on('pomodoro_completed', handler);
  return () => {
    s.off('pomodoro_completed', handler);
  };
};

export const onUserJoined = (callback: (user: { user_id: string; username: string }) => void): (() => void) => {
  const s = socket || connectSocket();
  const handler = (data: { user_id: string; username: string }) => callback(data);
  s.on('user_joined', handler);
  return () => {
    s.off('user_joined', handler);
  };
};

export const onUserLeft = (callback: (user: { user_id: string; username: string }) => void): (() => void) => {
  const s = socket || connectSocket();
  const handler = (data: { user_id: string; username: string }) => callback(data);
  s.on('user_left', handler);
  return () => {
    s.off('user_left', handler);
  };
};
