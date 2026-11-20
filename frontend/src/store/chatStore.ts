import { create } from 'zustand';
import { ChatMessage } from '../types';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  typingUsers: string[];
  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  addTypingUser: (username: string) => void;
  removeTypingUser: (username: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  typingUsers: [],

  addMessage: (msg: ChatMessage) => {
    set((state) => {
      // Avoid duplicate messages if already present
      if (state.messages.some((m) => m.id === msg.id)) {
        return state;
      }
      return { messages: [...state.messages, msg] };
    });
  },

  setMessages: (msgs: ChatMessage[]) => {
    set({ messages: msgs });
  },

  clearMessages: () => {
    set({ messages: [], typingUsers: [] });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  addTypingUser: (username: string) => {
    set((state) => {
      if (state.typingUsers.includes(username)) {
        return state;
      }
      return { typingUsers: [...state.typingUsers, username] };
    });
  },

  removeTypingUser: (username: string) => {
    set((state) => ({
      typingUsers: state.typingUsers.filter((u) => u !== username),
    }));
  },
}));
