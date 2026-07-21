import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { MdAdd } from 'react-icons/md';

import { CreateGuideModal } from '@/components/library/create-modal.component';
import { GuidesTable } from '@/components/library/table.component';
import { ListToolbar } from '@/components/ui/list-toolbar.component';
import { AdminPageContainer } from '@/components/ui/page-container.component';
import { guidesQueryOptions } from '@/queries/library.queries';

export const Route = createFileRoute('/_admin/library/')({
  ssr: false,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(guidesQueryOptions()),
  component: LibraryGuides,
});

function LibraryGuides() {
  const { data: guides } = useSuspenseQuery(guidesQueryOptions());
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) {return guides;}
    const q = search.toLowerCase();
    return guides.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        [...g.intentTags, ...g.platformTags, ...g.formatTags].some((tag) =>
          tag.toLowerCase().includes(q),
        ),
    );
  }, [guides, search]);

  return (
    <AdminPageContainer>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text sm:text-4xl">
            Guias de Conteúdo
          </h1>
          <p className="mt-2 text-[13px] text-text-sub sm:text-[14px]">
            Modelos reutilizáveis para criação de conteúdo.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary shrink-0 px-4 py-2.5"
        >
          <MdAdd size={18} />
          Novo guia
        </button>
      </div>

      <ListToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome ou tag..."
      />

      <GuidesTable guides={filtered} isLoading={false} />

      {showCreateModal && (
        <CreateGuideModal onClose={() => setShowCreateModal(false)} />
      )}
    </AdminPageContainer>
  );
}
