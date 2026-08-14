import type { ElementType } from 'react';
import { Suspense, useState } from 'react';
import { MdClose, MdExtension, MdOutlineCategory, MdOutlinePayments } from 'react-icons/md';

import { FinanceSettingsPanel } from '@/components/settings/finance-settings-panel.component';
import { IntegrationsSettingsPanel } from '@/components/settings/integrations-settings-panel.component';
import { TaskCategoriesSettingsPanel } from '@/components/settings/task-categories-settings-panel.component';
import { UnsavedChangesModal } from '@/components/settings/unsaved-changes-modal.component';
import { Spinner } from '@/components/ui/spinner.component';
import type { SettingsModuleKey } from '@/contexts/settings-modal.context';
import { useSettingsModal } from '@/contexts/settings-modal.context';

const TABS: { key: SettingsModuleKey; icon: ElementType; label: string }[] = [
  { key: 'task-categories', icon: MdOutlineCategory, label: 'Categorias de Tarefa' },
  { key: 'finance', icon: MdOutlinePayments, label: 'Financeiro' },
  { key: 'integrations', icon: MdExtension, label: 'Integrações' },
];

function PanelFallback() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner size={20} />
    </div>
  );
}

export function SettingsModal() {
  const { isOpen, activeTab, open, close } = useSettingsModal();

  const [taskCategoriesDirty, setTaskCategoriesDirty] = useState(false);
  const [financeDirty, setFinanceDirty] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

  if (!isOpen) {
    return null;
  }

  const requestClose = () => {
    if (taskCategoriesDirty || financeDirty) {
      setShowUnsavedConfirm(true);
      return;
    }
    close();
  };

  return (
    <>
      <div
        className="modal-overlay bg-black/50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            requestClose();
          }
        }}
      >
        <div className="flex h-[85vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex w-56 shrink-0 flex-col gap-1 border-r border-border p-3">
            <h2 className="px-2 py-2 text-[13px] font-bold text-text">Configurações</h2>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => open(tab.key)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition-colors ${
                  activeTab === tab.key
                    ? 'bg-orange/10 text-orange'
                    : 'text-text-sub hover:bg-bg hover:text-text'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex shrink-0 justify-end px-4 pt-4">
              <button
                type="button"
                onClick={requestClose}
                className="text-text-muted transition-colors hover:text-text"
              >
                <MdClose size={20} />
              </button>
            </div>

            <div className={activeTab === 'task-categories' ? 'contents' : 'hidden'}>
              <Suspense fallback={<PanelFallback />}>
                <TaskCategoriesSettingsPanel onDirtyChange={setTaskCategoriesDirty} />
              </Suspense>
            </div>

            <div className={activeTab === 'finance' ? 'contents' : 'hidden'}>
              <Suspense fallback={<PanelFallback />}>
                <FinanceSettingsPanel onDirtyChange={setFinanceDirty} />
              </Suspense>
            </div>

            <div className={activeTab === 'integrations' ? 'contents' : 'hidden'}>
              <Suspense fallback={<PanelFallback />}>
                <IntegrationsSettingsPanel />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {showUnsavedConfirm && (
        <UnsavedChangesModal
          onDiscard={() => {
            setShowUnsavedConfirm(false);
            close();
          }}
          onCancel={() => setShowUnsavedConfirm(false)}
        />
      )}
    </>
  );
}
