import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  User,
  Pod,
  Milestone,
  PomodoroSession,
  ChatMessage,
  QueueStatus,
  LoginCredentials,
  RegisterData,
  AuthTokens,
  MilestoneCreateData,
  PomodoroStartData,
  PeerStudent,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.endsWith('/api') 
      ? import.meta.env.VITE_API_URL 
      : `${import.meta.env.VITE_API_URL}/api`)
  : '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with auto-refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retried
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // If the 401 was from the refresh or login endpoint itself, don't loop
      if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem('access_token');
        return Promise.reject(error);
      }

      try {
        const response = await axios.post<AuthTokens>('/api/auth/refresh', {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = response.data;
        localStorage.setItem('access_token', access_token);
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }

        api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        processQueue(null, access_token);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr as AxiosError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  login: async (data: LoginCredentials): Promise<AuthTokens> => {
    const res = await api.post<AuthTokens>('/auth/login', data);
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },

  refresh: async (): Promise<AuthTokens> => {
    const refreshToken = localStorage.getItem('refresh_token');
    const res = await api.post<AuthTokens>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return res.data;
  },
};

export const podAPI = {
  joinQueue: async (examCategory: string): Promise<QueueStatus> => {
    const res = await api.post<QueueStatus>('/pods/queue/join', { exam_category: examCategory });
    return res.data;
  },

  getQueueStatus: async (): Promise<QueueStatus> => {
    const res = await api.get<QueueStatus>('/pods/queue/status');
    return res.data;
  },

  getMyPods: async (): Promise<Pod[]> => {
    const res = await api.get<Pod[]>('/pods/my');
    return res.data;
  },

  getPod: async (id: string): Promise<Pod> => {
    const res = await api.get<Pod>(`/pods/${id}`);
    return res.data;
  },

  leavePod: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const res = await api.post(`/pods/${id}/leave`);
    return res.data;
  },

  joinPodById: async (podId: string): Promise<{ message: string; pod: Pod }> => {
    const res = await api.post(`/pods/join/${podId}`);
    return res.data;
  },

  getPeers: async (search?: string, exam?: string): Promise<PeerStudent[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (exam && exam !== 'all') params.append('exam', exam);
    const res = await api.get<PeerStudent[]>(`/pods/community/peers?${params.toString()}`);
    return res.data;
  },

  invitePeer: async (podId: string, peerId: string): Promise<{ message: string; pod: Pod }> => {
    const res = await api.post(`/pods/${podId}/invite-peer/${peerId}`);
    return res.data;
  },
};

export const milestoneAPI = {
  create: async (data: MilestoneCreateData): Promise<Milestone> => {
    const res = await api.post<Milestone>('/milestones', data);
    return res.data;
  },

  getByPod: async (podId: string): Promise<Milestone[]> => {
    const res = await api.get<Milestone[]>(`/milestones/pod/${podId}`);
    return res.data;
  },

  updateStatus: async (id: string, status: Milestone['status']): Promise<Milestone> => {
    const res = await api.patch<Milestone>(`/milestones/${id}/status`, { status });
    return res.data;
  },

  getMy: async (): Promise<Milestone[]> => {
    const res = await api.get<Milestone[]>('/milestones/my');
    return res.data;
  },
};

export const pomodoroAPI = {
  start: async (data: PomodoroStartData): Promise<PomodoroSession> => {
    const res = await api.post<PomodoroSession>('/pomodoro/start', data);
    return res.data;
  },

  join: async (sessionId: string): Promise<PomodoroSession> => {
    const res = await api.post<PomodoroSession>(`/pomodoro/${sessionId}/join`);
    return res.data;
  },

  complete: async (sessionId: string): Promise<PomodoroSession> => {
    const res = await api.post<PomodoroSession>(`/pomodoro/${sessionId}/complete`);
    return res.data;
  },

  getActive: async (podId: string): Promise<PomodoroSession | null> => {
    const res = await api.get<PomodoroSession | null>(`/pomodoro/pod/${podId}/active`);
    return res.data;
  },

  getHistory: async (podId: string): Promise<PomodoroSession[]> => {
    const res = await api.get<PomodoroSession[]>(`/pomodoro/pod/${podId}/history`);
    return res.data;
  },
};

export const chatAPI = {
  getHistory: async (podId: string, limit: number = 50): Promise<ChatMessage[]> => {
    const res = await api.get<ChatMessage[]>(`/chat/history/${podId}`, {
      params: { limit },
    });
    return res.data;
  },

  sendMessage: async (podId: string, content: string): Promise<ChatMessage> => {
    const res = await api.post<ChatMessage>('/chat/messages', {
      pod_id: podId,
      content,
    });
    return res.data;
  },
};

export default api;
