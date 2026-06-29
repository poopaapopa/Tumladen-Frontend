import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Actor } from "../api/auth.ts";
import type { ActiveRoomSession } from "../types/user.ts";

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

interface UserState {
  actor: Actor | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  sessionCreatedAt: number | null;

  setAuth: (actor: Actor, token: string) => void;
  updateActor: (actor: Actor) => void;
  setCurrentRoom: (room: ActiveRoomSession | null) => void;
  clearCurrentRoom: () => void;
  logout: () => void;
  setIsLoggingOut: (isLoggingOut: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      actor: null,
      token: null,
      isAuthenticated: false,
      isLoggingOut: false,
      sessionCreatedAt: null,

      setAuth: (actor, token) => set({
        actor,
        token,
        isAuthenticated: true,
        isLoggingOut: false,
        sessionCreatedAt: Date.now(),
      }),

      updateActor: (actor) => set((state) => ({
        actor: state.actor
          ? { ...state.actor, ...actor }
          : actor,
      })),

      setCurrentRoom: (room) => set((state) => ({
        actor: state.actor
          ? { ...state.actor, currentRoom: room }
          : null,
      })),

      clearCurrentRoom: () => set((state) => ({
        actor: state.actor
          ? { ...state.actor, currentRoom: null }
          : null,
      })),

      logout: () => set({
        actor: null,
        token: null,
        isAuthenticated: false,
        isLoggingOut: true,
        sessionCreatedAt: null,
      }),
      
      setIsLoggingOut: (isLoggingOut) => set({ isLoggingOut }),
    }),
    {
      name: 'session',
      onRehydrateStorage: () => {
        return (state) => {
          if (!state) return;
          const { sessionCreatedAt } = state;
          if (sessionCreatedAt && Date.now() - sessionCreatedAt > SESSION_TTL_MS) {
            state.logout();
          }
        };
      },
    }
  )
);