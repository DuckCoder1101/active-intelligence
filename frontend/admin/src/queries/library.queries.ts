import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import type { Guide, SaveGuideDTO } from '@/models/guide.model';
import LibraryService from '@/services/library.service';

export const libraryKeys = {
  all: ['library'] as const,
  guides: () => [...libraryKeys.all, 'guides'] as const,
  guide: (guideId: string) => [...libraryKeys.all, 'guides', guideId] as const,
  nextSequence: () => [...libraryKeys.all, 'nextSequence'] as const,
};

export const guidesQueryOptions = () =>
  queryOptions({
    queryKey: libraryKeys.guides(),
    queryFn: () => LibraryService.listGuides(),
  });

export const guideQueryOptions = (guideId: string) =>
  queryOptions({
    queryKey: libraryKeys.guide(guideId),
    queryFn: () => LibraryService.getGuide(guideId),
  });

// Prévia informativa do próximo código (G-00X) — reflete o contador real no
// banco (não é um palpite baseado nos guias já carregados). Invalidada
// automaticamente após cada criação, junto do resto de libraryKeys.all.
export const nextGuideSequenceQueryOptions = () =>
  queryOptions({
    queryKey: libraryKeys.nextSequence(),
    queryFn: () => LibraryService.getNextGuideSequence(),
  });

export function useSaveGuideMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SaveGuideDTO) => LibraryService.saveGuide(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
    },
  });
}

export function useDeleteGuideMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (guideId: string) => LibraryService.deleteGuide(guideId),
    onMutate: async (guideId) => {
      await queryClient.cancelQueries({ queryKey: libraryKeys.guides() });
      const previous = queryClient.getQueryData<Guide[]>(
        libraryKeys.guides(),
      );
      queryClient.setQueryData<Guide[]>(libraryKeys.guides(), (old) =>
        old?.filter((g) => g.guideId !== guideId),
      );
      return { previous };
    },
    onError: (_err, _guideId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(libraryKeys.guides(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
    },
  });
}
