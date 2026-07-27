import { queryOptions } from '@tanstack/react-query';

import TaskCategoryService from '@/services/task-category.service';

export const taskCategoryKeys = {
  categories: ['task-categories'] as const,
};

export const taskCategoriesQueryOptions = () =>
  queryOptions({
    queryKey: taskCategoryKeys.categories,
    queryFn: () => TaskCategoryService.listCategories(),
  });
