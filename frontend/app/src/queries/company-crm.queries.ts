import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import type { CrmColumn, DealStatus, SaveLeadDTO } from '@/models/lead.model';
import CompanyCrmService from '@/services/company-crm.service';

export const companyCrmKeys = {
  all: ['company-crm'] as const,
  leads: (companyId: string) =>
    [...companyCrmKeys.all, 'leads', companyId] as const,
  tags: (companyId: string) =>
    [...companyCrmKeys.all, 'tags', companyId] as const,
  origins: (companyId: string) =>
    [...companyCrmKeys.all, 'origins', companyId] as const,
  columns: (companyId: string) =>
    [...companyCrmKeys.all, 'columns', companyId] as const,
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

export const crmColumnsQueryOptions = (companyId: string) =>
  queryOptions({
    queryKey: companyCrmKeys.columns(companyId),
    queryFn: () => CompanyCrmService.listColumns(companyId),
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

export function useDeleteTagMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagId: string) =>
      CompanyCrmService.deleteTag(companyId, tagId),
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

export function useDeleteOriginMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (originId: string) =>
      CompanyCrmService.deleteOrigin(companyId, originId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyCrmKeys.origins(companyId),
      });
    },
  });
}

function reorder<T extends { columnId: string; order: number }>(
  columns: T[],
  fromId: string,
  toId: string,
): T[] {
  const fromIndex = columns.findIndex((c) => c.columnId === fromId);
  const toIndex = columns.findIndex((c) => c.columnId === toId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return columns;
  }
  const reordered = [...columns];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);
  return reordered.map((c, i) => ({ ...c, order: i }));
}

export function useReorderCrmColumnsMutation(companyId: string) {
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
          companyCrmKeys.columns(companyId),
        ) ?? [];
      const withOrders = reorder(current, fromId, toId);
      const changed = withOrders.filter((c) => {
        const before = current.find((o) => o.columnId === c.columnId);
        return before && before.order !== c.order;
      });

      await Promise.all(
        changed.map((c) =>
          CompanyCrmService.saveColumn({
            companyId,
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
        queryKey: companyCrmKeys.columns(companyId),
      });
      const previous = queryClient.getQueryData<CrmColumn[]>(
        companyCrmKeys.columns(companyId),
      );
      queryClient.setQueryData(
        companyCrmKeys.columns(companyId),
        (prev: CrmColumn[] | undefined) =>
          prev ? reorder(prev, fromId, toId) : prev,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          companyCrmKeys.columns(companyId),
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: companyCrmKeys.columns(companyId),
      });
    },
  });
}

export function useAddCrmColumnMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      CompanyCrmService.saveColumn({ companyId, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyCrmKeys.columns(companyId),
      });
    },
  });
}

export function useRemoveCrmColumnMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (columnId: string) =>
      CompanyCrmService.deleteColumn(companyId, columnId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyCrmKeys.columns(companyId),
      });
      queryClient.invalidateQueries({
        queryKey: companyCrmKeys.leads(companyId),
      });
    },
  });
}
