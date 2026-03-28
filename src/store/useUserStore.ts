import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Actor } from "../api/auth.ts";

interface UserState {
  actor: Actor | null;
  token: string | null;
  isAuthenticated: boolean;

  setAuth: (actor: Actor, token: string) => void;
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