import {
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';

import { CrmBoard } from '@/components/company/crm/crm-board.component';
import { CrmFunnelTabs } from '@/components/company/crm/crm-funnel-tabs.component';
import { LeadDrawer } from '@/components/company/crm/lead-drawer.component';
import type { Lead } from '@/models/lead.model';
import {
  crmColumnsQueryOptions,
  crmFunnelsQueryOptions,
  crmOriginsQueryOptions,
  crmTagsQueryOptions,
  crmTeammatesQueryOptions,
  leadsQueryOptions,
} from '@/queries/company-crm.queries';

interface CrmSearchParams {
  funnel?: string;
}

export const Route = createFileRoute('/_private/company/$companyId/crm')({
  validateSearch: (search): CrmSearchParams => ({
    funnel:
      typeof search.funnel === 'string' && search.funnel.length > 0
        ? search.funnel
        : undefined,
  }),
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(leadsQueryOptions(params.companyId)),
      context.queryClient.ensureQueryData(
        crmFunnelsQueryOptions(params.companyId),
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
  const { funnel } = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();
  const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: leads } = useSuspenseQuery(leadsQueryOptions(companyId));
  const { data: funnels } = useSuspenseQuery(
    crmFunnelsQueryOptions(companyId),
  );
  const { data: tags } = useSuspenseQuery(crmTagsQueryOptions(companyId));
  const { data: origins } = useSuspenseQuery(
    crmOriginsQueryOptions(companyId),
  );
  const { data: teammates = [] } = useQuery(
    crmTeammatesQueryOptions(companyId),
  );

  const activeFunnelId =
    funnel && funnels.some((f) => f.funnelId === funnel)
      ? funnel
      : funnels[0].funnelId;

  const selectFunnel = (funnelId: string) => {
    navigate({ search: { funnel: funnelId }, replace: true });
  };

  const { data: columns } = useSuspenseQuery(
    crmColumnsQueryOptions(companyId, activeFunnelId),
  );

  const funnelLeads = useMemo(
    () => leads.filter((lead) => lead.funnelId === activeFunnelId),
    [leads, activeFunnelId],
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
      <div className="flex flex-1 flex-col overflow-hidden">
        <CrmFunnelTabs
          companyId={companyId}
          funnels={funnels}
          activeFunnelId={activeFunnelId}
          onSelect={selectFunnel}
        />
        <CrmBoard
          companyId={companyId}
          funnelId={activeFunnelId}
          leads={funnelLeads}
          columns={columns}
          tags={tags}
          onLeadClick={openEdit}
          onNewLead={openNew}
        />
      </div>

      {drawerOpen && (
        <LeadDrawer
          companyId={companyId}
          funnelId={activeFunnelId}
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
