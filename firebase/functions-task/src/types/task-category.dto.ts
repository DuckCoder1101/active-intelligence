export interface TaskSubcategoryDTO {
  subcategoryId: string;
  name: string;
  order: number;
}

export interface TaskCategoryDTO {
  categoryId: string;
  name: string;
  color: string;
  order: number;
  subcategories: TaskSubcategoryDTO[];
}

export interface SaveTaskCategoryDTO {
  categoryId?: string;
  name: string;
  color: string;
  order?: number;
}

export interface SaveTaskSubcategoryDTO {
  categoryId: string;
  subcategoryId?: string;
  name: string;
  order?: number;
}
