import { create } from 'zustand';
import type { User } from '../api';
import { api } from '../api';
import { gooseWebSocketService } from '../services/websocket';

type AuthState = {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  hydrateFromApi: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  setUser: (user) => {
    set({ user });
    if (user) {
      gooseWebSocketService.connect();
    } else {
      gooseWebSocketService.disconnect();
    }
  },
  hydrateFromApi: async () => {
    set({ isLoading: true });
    try {
      const me = await api.me();
      if (me) {
        set({ user: me });
        gooseWebSocketService.connect();
      } else {
        set({ user: null });
        gooseWebSocketService.disconnect();
      }
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },
  logout: async () => {
    set({ isLoading: true });
    await api.logout();

    gooseWebSocketService.disconnect();
    set({ user: null, isLoading: false });
  },
}));
