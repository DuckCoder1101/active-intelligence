import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import type { SavePlanDTO } from '@/models/plan.model';
import PlanService from '@/services/plan.service';

export const planKeys = {
  all: ['plans'] as const,
  lists: () => [...planKeys.all, 'list'] as const,
};

export const plansQueryOptions = () =>
  queryOptions({
    queryKey: planKeys.lists(),
    queryFn: () => PlanService.listPlans(),
  });

export function useSavePlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: SavePlanDTO) => PlanService.savePlan(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}

export function useDeletePlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => PlanService.deletePlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}
