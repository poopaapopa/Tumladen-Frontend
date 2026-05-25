import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Actor } from "../api/auth.ts";
import type { ActiveRoomSession } from "../types/user.ts";

interface UserState {
  actor: Actor | null;
  token: string | null;
  isAuthenticated: boolean;

  setAuth: (actor: Actor, token: string) => void;
  updateActor: (actor: Actor) => void;
  setCurrentRoom: (room: ActiveRoomSession | null) => void;
  clearCurrentRoom: () => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      actor: null,
      token: null,
      isAuthenticated: false,

      setAuth: (actor, token) => set({
        actor,
        token,
        isAuthenticated: true
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
        isAuthenticated: false
      }),
    }),
    {
      name: 'session',
    }
  )
);