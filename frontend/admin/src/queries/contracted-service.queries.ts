import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import ContractedServiceService from '@/services/contracted-service.service';

export const contractedServiceKeys = {
  all: ['contracted-services'] as const,
  lists: () => [...contractedServiceKeys.all, 'list'] as const,
};

export const contractedServicesQueryOptions = () =>
  queryOptions({
    queryKey: contractedServiceKeys.lists(),
    queryFn: () => ContractedServiceService.listContractedServices(),
  });

export function useSaveContractedServiceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) =>
      ContractedServiceService.saveContractedService(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractedServiceKeys.all });
    },
  });
}
