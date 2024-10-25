import { create } from 'zustand';

interface GameState {
  username: string;
  roomId: string;
  setUsername: (username: string) => void;
  setRoomId: (roomId: string) => void;
}

export const useGameStore = create<GameState>((set) => ({
  username: '',
  roomId: '',
  setUsername: (username) => set({ username }),
  setRoomId: (roomId) => set({ roomId }),
}));