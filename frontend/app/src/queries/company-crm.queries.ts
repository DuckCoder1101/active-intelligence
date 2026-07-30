import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import type {
  CrmColumn,
  CrmFunnel,
  DealStatus,
  SaveLeadDTO,
} from '@/models/lead.model';
import CompanyCrmService from '@/services/company-crm.service';

export const companyCrmKeys = {
  all: ['company-crm'] as const,
  leads: (companyId: string) =>
    [...companyCrmKeys.all, 'leads', companyId] as const,
  tags: (companyId: string) =>
    [...companyCrmKeys.all, 'tags', companyId] as const,
  origins: (companyId: string) =>
    [...companyCrmKeys.all, 'origins', companyId] as const,
  funnels: (companyId: string) =>
    [...companyCrmKeys.all, 'funnels', companyId] as const,
  columns: (companyId: string, funnelId: string) =>
    [...companyCrmKeys.all, 'columns', companyId, funnelId] as const,
  teammates: (companyId: string) =>
    [...companyCrmKeys.all, 'teammates', companyId] as const,
};

export const leadsQueryOptions = (companyId: string) =>
  queryOptions({
    queryKey: companyCrmKeys.leads(companyId),
    queryFn: () => CompanyCrmService.listLeads(companyId),
  });

export const crmTagsQueryOptions = (companyId: string) =>
  queryOptions({
    queryKey: companyCrmKeys.tags(companyId),
    queryFn: () => CompanyCrmService.listTags(companyId),
  });

export const crmOriginsQueryOptions = (companyId: string) =>
  queryOptions({
    queryKey: companyCrmKeys.origins(companyId),
    queryFn: () => CompanyCrmService.listOrigins(companyId),
  });

export const crmFunnelsQueryOptions = (companyId: string) =>
  queryOptions({
    queryKey: companyCrmKeys.funnels(companyId),
    queryFn: () => CompanyCrmService.listFunnels(companyId),
  });

export const crmColumnsQueryOptions = (companyId: string, funnelId: string) =>
  queryOptions({
    queryKey: companyCrmKeys.columns(companyId, funnelId),
    queryFn: () => CompanyCrmService.listColumns(companyId, funnelId),
  });

export const crmTeammatesQueryOptions = (companyId: string) =>
  queryOptions({
    queryKey: companyCrmKeys.teammates(companyId),
    queryFn: () => CompanyCrmService.listMyCompanyUsers(companyId),
  });

export function useSaveLeadMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SaveLeadDTO) => CompanyCrmService.saveLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyCrmKeys.leads(companyId),
      });
    },
  });
}

export function useDeleteLeadMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leadId: string) =>
      CompanyCrmService.deleteLead(companyId, leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyCrmKeys.leads(companyId),
      });
    },
  });
}

export function useUpdateLeadStatusMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, status }: { leadId: string; status: string }) =>
      CompanyCrmService.updateLeadStatus(companyId, leadId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyCrmKeys.leads(companyId),
      });
    },
  });
}

export function useUpdateLeadDealStatusMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leadId,
      dealStatus,
    }: {
      leadId: string;
      dealStatus: DealStatus;
    }) => CompanyCrmService.updateLeadDealStatus(companyId, leadId, dealStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyCrmKeys.leads(companyId),
      });
    },
  });
}

export function useSaveTagMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => CompanyCrmService.saveTag(companyId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyCrmKeys.tags(companyId),
      });
    },
  });
}

export function useSaveOriginMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) =>
      CompanyCrmService.saveOrigin(companyId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyCrmKeys.origins(companyId),
      });
    },
  });
}

function reorder<T extends { order: number }>(
  items: T[],
  idKey: keyof T,
  fromId: string,
  toId: string,
): T[] {
  const fromIndex = items.findIndex((c) => c[idKey] === fromId);
  const toIndex = items.findIndex((c) => c[idKey] === toId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return items;
  }
  const reordered = [...items];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);
  return reordered.map((c, i) => ({ ...c, order: i }));
}

export function useReorderCrmColumnsMutation(
  companyId: string,
  funnelId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fromId,
      toId,
    }: {
      fromId: string;
      toId: string;
    }) => {
      const current =
        queryClient.getQueryData<CrmColumn[]>(
          companyCrmKeys.columns(companyId, funnelId),
        ) ?? [];
      const withOrders = reorder(current, 'columnId', fromId, toId);
      const changed = withOrders.filter((c) => {
        const before = current.find((o) => o.columnId === c.columnId);
        return before && before.order !== c.order;
      });

      await Promise.all(
        changed.map((c) =>
          CompanyCrmService.saveColumn({
            companyId,
            funnelId,
            columnId: c.columnId,
            name: c.name,
            color: c.color,
            order: c.order,
          }),
        ),
      );

      return withOrders;
    },
    onMutate: async ({ fromId, toId }) => {
      await queryClient.cancelQueries({
        queryKey: companyCrmKeys.columns(companyId, funnelId),
      });
      const previous = queryClient.getQueryData<CrmColumn[]>(
        companyCrmKeys.columns(companyId, funnelId),
      );
      queryClient.setQueryData(
        companyCrmKeys.columns(companyId, funnelId),
        (prev: CrmColumn[] | undefined) =>
          prev ? reorder(prev, 'columnId', fromId, toId) : prev,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          companyCrmKeys.columns(companyId, funnelId),
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: companyCrmKeys.columns(companyId, funnelId),
      });
    },
  });
}

export function useAddCrmColumnMutation(companyId: string, funnelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      CompanyCrmService.saveColumn({ companyId, funnelId, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyCrmKeys.columns(companyId, funnelId),
      });
    },
  });
}

export function useRemoveCrmColumnMutation(
  companyId: string,
  funnelId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (columnId: string) =>
      CompanyCrmService.deleteColumn(companyId, funnelId, columnId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyCrmKeys.columns(companyId, funnelId),
      });
      queryClient.invalidateQueries({
        queryKey: companyCrmKeys.leads(companyId),
      });
    },
  });
}

export function useSaveFunnelMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; funnelId?: string }) =>
      CompanyCrmService.saveFunnel({ companyId, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyCrmKeys.funnels(companyId),
      });
    },
  });
}

export function useRemoveFunnelMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (funnelId: string) =>
      CompanyCrmService.deleteFunnel(companyId, funnelId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyCrmKeys.funnels(companyId),
      });
      queryClient.invalidateQueries({
        queryKey: companyCrmKeys.leads(companyId),
      });
    },
  });
}

export function useReorderFunnelsMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fromId,
      toId,
    }: {
      fromId: string;
      toId: string;
    }) => {
      const current =
        queryClient.getQueryData<CrmFunnel[]>(
          companyCrmKeys.funnels(companyId),
        ) ?? [];
      const withOrders = reorder(current, 'funnelId', fromId, toId);
      const changed = withOrders.filter((f) => {
        const before = current.find((o) => o.funnelId === f.funnelId);
        return before && before.order !== f.order;
      });

      await Promise.all(
        changed.map((f) =>
          CompanyCrmService.saveFunnel({
            companyId,
            funnelId: f.funnelId,
            name: f.name,
            order: f.order,
          }),
        ),
      );

      return withOrders;
    },
    onMutate: async ({ fromId, toId }) => {
      await queryClient.cancelQueries({
        queryKey: companyCrmKeys.funnels(companyId),
      });
      const previous = queryClient.getQueryData<CrmFunnel[]>(
        companyCrmKeys.funnels(companyId),
      );
      queryClient.setQueryData(
        companyCrmKeys.funnels(companyId),
        (prev: CrmFunnel[] | undefined) =>
          prev ? reorder(prev, 'funnelId', fromId, toId) : prev,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          companyCrmKeys.funnels(companyId),
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: companyCrmKeys.funnels(companyId),
      });
    },
  });
}
