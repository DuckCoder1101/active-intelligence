import { queryOptions } from '@tanstack/react-query';

import LibraryService from '@/services/library.service';

export const libraryKeys = {
  all: ['library'] as const,
  assignedGuides: (companyId: string) =>
    [...libraryKeys.all, 'assigned', companyId] as const,
  assignedGuide: (companyId: string, guideId: string) =>
    [...libraryKeys.all, 'assigned', companyId, guideId] as const,
  publicGuide: (guideId: string) =>
    [...libraryKeys.all, 'public', guideId] as const,
};

export const assignedGuidesQueryOptions = (companyId: string) =>
  queryOptions({
    queryKey: libraryKeys.assignedGuides(companyId),
    queryFn: () => LibraryService.listAssignedGuides(companyId),
  });

export const assignedGuideQueryOptions = (companyId: string, guideId: string) =>
  queryOptions({
    queryKey: libraryKeys.assignedGuide(companyId, guideId),
    queryFn: () => LibraryService.getAssignedGuide(companyId, guideId),
  });

export const publicGuideQueryOptions = (guideId: string) =>
  queryOptions({
    queryKey: libraryKeys.publicGuide(guideId),
    queryFn: () => LibraryService.getPublicGuide(guideId),
  });
