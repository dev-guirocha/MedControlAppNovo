import { create } from 'zustand';

interface AppLoadingState {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

export const useAppLoadingStore = create<AppLoadingState>((set) => ({
  isLoading: true, // Começamos como "carregando"
  
  startLoading: () => set({ isLoading: true }),
  stopLoading: () => set({ isLoading: false }),
}));