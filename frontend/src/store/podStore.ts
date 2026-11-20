import { create } from 'zustand';
import { Pod, QueueStatus } from '../types';
import { podAPI } from '../services/api';

interface PodState {
  pods: Pod[];
  activePod: Pod | null;
  queueStatus: QueueStatus | null;
  isLoading: boolean;
  fetchPods: () => Promise<void>;
  setPods: (pods: Pod[]) => void;
  setActivePod: (pod: Pod | null) => void;
  joinQueue: (exam: string) => Promise<QueueStatus>;
  checkQueueStatus: () => Promise<QueueStatus | null>;
  leavePod: (podId: string) => Promise<void>;
}

export const usePodStore = create<PodState>((set, get) => ({
  pods: [],
  activePod: null,
  queueStatus: null,
  isLoading: false,

  fetchPods: async () => {
    set({ isLoading: true });
    try {
      const pods = await podAPI.getMyPods();
      set({ pods, isLoading: false });
      // If activePod is not set but pods exist, default to first or keep current if present
      const currentActive = get().activePod;
      if (currentActive) {
        const refreshed = pods.find((p) => p.id === currentActive.id);
        if (refreshed) {
          set({ activePod: refreshed });
        }
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setPods: (pods: Pod[]) => {
    set({ pods });
  },

  setActivePod: (pod: Pod | null) => {
    set({ activePod: pod });
  },

  joinQueue: async (exam: string) => {
    set({ isLoading: true });
    try {
      const status = await podAPI.joinQueue(exam);
      set({ queueStatus: status, isLoading: false });
      return status;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  checkQueueStatus: async () => {
    try {
      const status = await podAPI.getQueueStatus();
      set({ queueStatus: status });
      return status;
    } catch {
      set({ queueStatus: null });
      return null;
    }
  },

  leavePod: async (podId: string) => {
    set({ isLoading: true });
    try {
      await podAPI.leavePod(podId);
      const updatedPods = get().pods.filter((p) => p.id !== podId);
      const active = get().activePod?.id === podId ? (updatedPods[0] || null) : get().activePod;
      set({ pods: updatedPods, activePod: active, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
