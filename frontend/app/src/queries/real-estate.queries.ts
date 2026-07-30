import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import type {
  RealEstateStatus,
  SaveRealEstateDTO,
} from '@/models/real-estate.model';
import RealEstateService from '@/services/real-estate.service';

export const realEstateKeys = {
  all: ['real-estate'] as const,
  list: (companyId: string) =>
    [...realEstateKeys.all, 'list', companyId] as const,
};

export const realEstateQueryOptions = (companyId: string) =>
  queryOptions({
    queryKey: realEstateKeys.list(companyId),
    queryFn: () => RealEstateService.listRealEstate(companyId),
  });

export function useSaveRealEstateMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SaveRealEstateDTO) =>
      RealEstateService.saveRealEstate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: realEstateKeys.list(companyId),
      });
    },
  });
}

export function useDeleteRealEstateMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (realEstateId: string) =>
      RealEstateService.deleteRealEstate(companyId, realEstateId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: realEstateKeys.list(companyId),
      });
    },
  });
}

export function useUpdateRealEstateStatusMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      realEstateId,
      status,
    }: {
      realEstateId: string;
      status: RealEstateStatus;
    }) =>
      RealEstateService.updateRealEstateStatus(
        companyId,
        realEstateId,
        status,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: realEstateKeys.list(companyId),
      });
    },
  });
}
