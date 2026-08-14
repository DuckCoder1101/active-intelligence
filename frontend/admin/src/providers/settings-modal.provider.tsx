import { useState } from 'react';
import type { ReactNode } from 'react';

import type { SettingsModuleKey } from '@/contexts/settings-modal.context';
import { SettingsModalContext } from '@/contexts/settings-modal.context';

interface SettingsModalProviderProps {
  children: ReactNode;
}

export function SettingsModalProvider({ children }: SettingsModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsModuleKey>('task-categories');

  const open = (tab?: SettingsModuleKey) => {
    if (tab) {
      setActiveTab(tab);
    }
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  return (
    <SettingsModalContext.Provider value={{ isOpen, activeTab, open, close }}>
      {children}
    </SettingsModalContext.Provider>
  );
}
