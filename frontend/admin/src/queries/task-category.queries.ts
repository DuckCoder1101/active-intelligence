import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import type {
  SaveTaskCategoryDTO,
  SaveTaskSubcategoryDTO,
} from '@/models/task.model';
import TaskCategoryService from '@/services/task-category.service';

export const taskCategoryKeys = {
  categories: ['task-categories'] as const,
  tags: ['task-tags'] as const,
};

export const taskCategoriesQueryOptions = () =>
  queryOptions({
    queryKey: taskCategoryKeys.categories,
    queryFn: () => TaskCategoryService.listCategories(),
  });

export const taskTagsQueryOptions = () =>
  queryOptions({
    queryKey: taskCategoryKeys.tags,
    queryFn: () => TaskCategoryService.listTags(),
  });

export function useSaveTaskCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveTaskCategoryDTO) =>
      TaskCategoryService.saveCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskCategoryKeys.categories });
    },
  });
}

export function useDeleteTaskCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) =>
      TaskCategoryService.deleteCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskCategoryKeys.categories });
    },
  });
}

export function useSaveTaskSubcategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveTaskSubcategoryDTO) =>
      TaskCategoryService.saveSubcategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskCategoryKeys.categories });
    },
  });
}

export function useDeleteTaskSubcategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      subcategoryId,
    }: {
      categoryId: string;
      subcategoryId: string;
    }) => TaskCategoryService.deleteSubcategory(categoryId, subcategoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskCategoryKeys.categories });
    },
  });
}

export function useSaveTaskTagMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => TaskCategoryService.saveTag(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskCategoryKeys.tags });
    },
  });
}

export function useDeleteTaskTagMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) => TaskCategoryService.deleteTag(tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskCategoryKeys.tags });
    },
  });
}
