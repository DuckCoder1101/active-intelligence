import { createContext, useContext } from 'react';

export type SettingsModuleKey = 'task-categories' | 'finance' | 'integrations';

export interface SettingsModalContextState {
  isOpen: boolean;
  activeTab: SettingsModuleKey;
  open: (tab?: SettingsModuleKey) => void;
  close: () => void;
}

export const SettingsModalContext = createContext<SettingsModalContextState | null>(
  null,
);

export function useSettingsModal() {
  const ctx = useContext(SettingsModalContext);
  if (!ctx) {throw new Error('useSettingsModal must be used within SettingsModalProvider');}
  return ctx;
}
