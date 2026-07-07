import {
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { CrmBoard } from '@/components/company/crm/crm-board.component';
import { LeadDrawer } from '@/components/company/crm/lead-drawer.component';
import type { Lead } from '@/models/lead.model';
import {
  crmColumnsQueryOptions,
  crmOriginsQueryOptions,
  crmTagsQueryOptions,
  crmTeammatesQueryOptions,
  leadsQueryOptions,
} from '@/queries/company-crm.queries';

export const Route = createFileRoute('/company/$companyId/crm')({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(leadsQueryOptions(params.companyId)),
      context.queryClient.ensureQueryData(
        crmColumnsQueryOptions(params.companyId),
      ),
      context.queryClient.ensureQueryData(
        crmTagsQueryOptions(params.companyId),
      ),
      context.queryClient.ensureQueryData(
        crmOriginsQueryOptions(params.companyId),
      ),
      context.queryClient.ensureQueryData(
        crmTeammatesQueryOptions(params.companyId),
      ),
    ]),
  component: CompanyCrm,
  ssr: false,
});

function CompanyCrm() {
  const { companyId } = Route.useParams();
  const queryClient = useQueryClient();
  const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: leads } = useSuspenseQuery(leadsQueryOptions(companyId));
  const { data: columns } = useSuspenseQuery(
    crmColumnsQueryOptions(companyId),
  );
  const { data: tags } = useSuspenseQuery(crmTagsQueryOptions(companyId));
  const { data: origins } = useSuspenseQuery(
    crmOriginsQueryOptions(companyId),
  );
  const { data: teammates = [] } = useQuery(
    crmTeammatesQueryOptions(companyId),
  );

  const openNew = () => {
    setEditingLead(undefined);
    setDrawerOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingLead(undefined);
  };

  const handleSaved = () => {
    queryClient.invalidateQueries({
      queryKey: leadsQueryOptions(companyId).queryKey,
    });
  };

  return (
    <>
      <CrmBoard
        companyId={companyId}
        leads={leads}
        columns={columns}
        tags={tags}
        onLeadClick={openEdit}
        onNewLead={openNew}
      />

      {drawerOpen && (
        <LeadDrawer
          companyId={companyId}
          lead={editingLead}
          origins={origins}
          tags={tags}
          teammates={teammates}
          onClose={closeDrawer}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
