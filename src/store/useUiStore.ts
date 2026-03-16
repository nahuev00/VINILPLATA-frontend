import { create } from "zustand";

interface UiState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: true, // Por defecto el menú lateral estará abierto
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
