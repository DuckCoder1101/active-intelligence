import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, redirect, useBlocker } from '@tanstack/react-router';
import { useState } from 'react';
import { MdMenu, MdOutlineCategory, MdOutlinePayments } from 'react-icons/md';
import { toast } from 'react-toastify';

import type { SidebarNavItem } from '@/components/layout/sidebar.component';
import { Sidebar } from '@/components/layout/sidebar.component';
import { CategoriesPanel } from '@/components/settings/categories-panel.component';
import { FinanceSettingsPanel } from '@/components/settings/finance-settings-panel.component';
import { SubcategoriesPanel } from '@/components/settings/subcategories-panel.component';
import { UnsavedChangesModal } from '@/components/settings/unsaved-changes-modal.component';
import { Spinner } from '@/components/ui/spinner.component';
import {
  financeAccountsQueryOptions,
  financeSubcategoriesQueryOptions,
} from '@/queries/finance.queries';
import {
  taskCategoriesQueryOptions,
  useDeleteTaskCategoryMutation,
  useDeleteTaskSubcategoryMutation,
  useSaveTaskCategoryMutation,
  useSaveTaskSubcategoryMutation,
} from '@/queries/task-category.queries';
import type { RouteAccessLevel } from '@/types/route-access.type';
import { checkRouteAccess } from '@/utils/checkRouteAccess.util';
import type { DraftCategory } from '@/utils/task-category-draft.util';
import { isDraftDirty, newKey, toDraft } from '@/utils/task-category-draft.util';

const ROUTE_ACCESS: RouteAccessLevel = {
  minAccessLevel: 'admin',
  permissions: ['manage-settings'],
};

type SettingsModuleKey = 'task-categories' | 'finance';

const SIDEBAR_COLLAPSED_KEY = 'settings-sidebar-collapsed';

export const Route = createFileRoute('/_private/settings')({
  ssr: false,
  beforeLoad: ({ context }) => {
    if (!checkRouteAccess(context.sessionUser, ROUTE_ACCESS)) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData({
        ...taskCategoriesQueryOptions(),
        revalidateIfStale: true,
      }),
      context.queryClient.ensureQueryData(financeSubcategoriesQueryOptions()),
      context.queryClient.ensureQueryData(financeAccountsQueryOptions()),
    ]),
  component: SettingsPage,
});

function SettingsPage() {
  const [selectedModule, setSelectedModule] = useState<SettingsModuleKey>('task-categories');
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1',
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      return next;
    });
  };

  const sidebarItems: SidebarNavItem[] = [
    {
      key: 'task-categories',
      icon: MdOutlineCategory,
      label: 'Categorias de Tarefa',
      onClick: () => setSelectedModule('task-categories'),
      active: selectedModule === 'task-categories',
    },
    {
      key: 'finance',
      icon: MdOutlinePayments,
      label: 'Financeiro',
      onClick: () => setSelectedModule('finance'),
      active: selectedModule === 'finance',
    },
  ];

  const queryClient = useQueryClient();
  const { data: categories } = useSuspenseQuery(taskCategoriesQueryOptions());

  const [original, setOriginal] = useState<DraftCategory[]>(() => toDraft(categories));
  const [draft, setDraft] = useState<DraftCategory[]>(() => toDraft(categories));
  const [removedCategoryIds, setRemovedCategoryIds] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | undefined>(draft[0]?.key);
  const [isSaving, setIsSaving] = useState(false);

  const saveCategory = useSaveTaskCategoryMutation();
  const deleteCategory = useDeleteTaskCategoryMutation();
  const saveSubcategory = useSaveTaskSubcategoryMutation();
  const deleteSubcategory = useDeleteTaskSubcategoryMutation();

  const dirty = isDraftDirty(draft, original, removedCategoryIds);

  const blocker = useBlocker({
    shouldBlockFn: () => dirty,
    withResolver: true,
  });

  const resetDraft = (source: typeof categories) => {
    const fresh = toDraft(source);
    setOriginal(fresh);
    setDraft(fresh);
    setRemovedCategoryIds([]);
    setSelectedKey((prev) => (fresh.some((c) => c.key === prev) ? prev : fresh[0]?.key));
  };

  const handleCancel = () => resetDraft(categories);

  const handleAddCategory = (name: string, color: string) => {
    const category: DraftCategory = {
      key: newKey(),
      name,
      color,
      order: draft.length,
      subcategories: [],
      removedSubcategoryIds: [],
    };
    setDraft((prev) => [...prev, category]);
    setSelectedKey(category.key);
  };

  const handleRemoveCategory = (key: string) => {
    const category = draft.find((c) => c.key === key);
    if (!category) {
      return;
    }
    if (category.categoryId) {
      setRemovedCategoryIds((prev) => [...prev, category.categoryId!]);
    }
    setDraft((prev) => {
      const next = prev.filter((c) => c.key !== key);
      if (selectedKey === key) {
        setSelectedKey(next[0]?.key);
      }
      return next;
    });
  };

  const handleReorderCategories = (fromKey: string, toKey: string) => {
    setDraft((prev) => {
      const fromIndex = prev.findIndex((c) => c.key === fromKey);
      const toIndex = prev.findIndex((c) => c.key === toKey);
      if (fromIndex === -1 || toIndex === -1) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const updateSelectedCategory = (updater: (category: DraftCategory) => DraftCategory) => {
    setDraft((prev) =>
      prev.map((c) => (c.key === selectedKey ? updater(c) : c)),
    );
  };

  const handleAddSubcategory = (name: string) => {
    updateSelectedCategory((c) => ({
      ...c,
      subcategories: [
        ...c.subcategories,
        { key: newKey(), name, order: c.subcategories.length },
      ],
    }));
  };

  const handleRemoveSubcategory = (key: string) => {
    updateSelectedCategory((c) => {
      const sub = c.subcategories.find((s) => s.key === key);
      return {
        ...c,
        subcategories: c.subcategories.filter((s) => s.key !== key),
        removedSubcategoryIds:
          sub?.subcategoryId
            ? [...c.removedSubcategoryIds, sub.subcategoryId]
            : c.removedSubcategoryIds,
      };
    });
  };

  const handleReorderSubcategories = (fromKey: string, toKey: string) => {
    updateSelectedCategory((c) => {
      const fromIndex = c.subcategories.findIndex((s) => s.key === fromKey);
      const toIndex = c.subcategories.findIndex((s) => s.key === toKey);
      if (fromIndex === -1 || toIndex === -1) {
        return c;
      }
      const subcategories = [...c.subcategories];
      const [moved] = subcategories.splice(fromIndex, 1);
      subcategories.splice(toIndex, 0, moved);
      return { ...c, subcategories };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Cria/atualiza tudo que sobrevive no rascunho primeiro — só depois
      // exclui as categorias removidas. Na ordem inversa, excluir a última
      // categoria existente antes de uma nova entrar no lugar dela
      // esbarraria na trava de "não pode ficar sem nenhuma categoria".
      for (let i = 0; i < draft.length; i++) {
        const cat = draft[i];
        const orig = original.find((o) => o.categoryId === cat.categoryId);
        let categoryId = cat.categoryId;

        const categoryChanged =
          !categoryId || !orig || orig.name !== cat.name || orig.color !== cat.color || orig.order !== i;
        if (categoryChanged) {
          const saved = await saveCategory.mutateAsync({
            categoryId,
            name: cat.name,
            color: cat.color,
            order: i,
          });
          categoryId = saved.categoryId;
        }

        for (const subcategoryId of cat.removedSubcategoryIds) {
          await deleteSubcategory.mutateAsync({ categoryId: categoryId!, subcategoryId });
        }

        for (let j = 0; j < cat.subcategories.length; j++) {
          const sub = cat.subcategories[j];
          const origSub = orig?.subcategories.find((s) => s.subcategoryId === sub.subcategoryId);
          const subChanged = !sub.subcategoryId || !origSub || origSub.name !== sub.name || origSub.order !== j;
          if (subChanged) {
            await saveSubcategory.mutateAsync({
              categoryId: categoryId!,
              subcategoryId: sub.subcategoryId,
              name: sub.name,
              order: j,
            });
          }
        }
      }

      for (const categoryId of removedCategoryIds) {
        await deleteCategory.mutateAsync(categoryId);
      }

      toast.success('Configurações salvas!');
      const fresh = await queryClient.fetchQuery(taskCategoriesQueryOptions());
      resetDraft(fresh);
    } catch {
      toast.error('Não foi possível salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCategory = draft.find((c) => c.key === selectedKey);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <Sidebar
        items={sidebarItems}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        className="lg:static"
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Ambos os módulos ficam sempre montados (só a visibilidade alterna) pra
            trocar de módulo não descartar silenciosamente um rascunho não salvo. */}
        <div className={selectedModule === 'task-categories' ? 'contents' : 'hidden'}>
            <div className="flex shrink-0 items-center gap-3 border-b border-border px-6 py-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="text-text-muted transition-colors hover:text-text lg:hidden"
              >
                <MdMenu size={20} />
              </button>
              <div>
                <h1 className="text-[18px] font-bold text-text">Categorias de Tarefa</h1>
                <p className="mt-0.5 text-[12px] text-text-sub">
                  Categorias e subcategorias usadas no Kanban do Workspace.
                </p>
              </div>
            </div>

            <div className="flex flex-1 gap-8 overflow-y-auto px-6 py-6">
              <CategoriesPanel
                categories={draft}
                selectedKey={selectedKey}
                onSelect={setSelectedKey}
                onReorder={handleReorderCategories}
                onAdd={handleAddCategory}
                onRemove={handleRemoveCategory}
              />

              {selectedCategory ? (
                <SubcategoriesPanel
                  category={selectedCategory}
                  onAdd={handleAddSubcategory}
                  onRemove={handleRemoveSubcategory}
                  onReorder={handleReorderSubcategories}
                />
              ) : (
                <p className="text-[13px] text-text-muted">
                  Crie uma categoria pra gerenciar suas subcategorias.
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={!dirty || isSaving}
                className="btn-ghost-border"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!dirty || isSaving}
                className="btn-primary"
              >
                {isSaving && <Spinner size={12} />}
                Salvar
              </button>
            </div>
        </div>

        <div className={selectedModule === 'finance' ? 'contents' : 'hidden'}>
          <FinanceSettingsPanel />
        </div>
      </div>

      {blocker.status === 'blocked' && (
        <UnsavedChangesModal onDiscard={blocker.proceed} onCancel={blocker.reset} />
      )}
    </div>
  );
}
