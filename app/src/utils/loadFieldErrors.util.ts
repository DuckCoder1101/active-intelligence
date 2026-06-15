import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

type ZodTree = {
  properties?: Record<string, { errors: string[] }>;
};

export function loadFielErrors<T extends FieldValues>(
  customData: unknown,
  setError: UseFormSetError<T>,
): void {
  const tree = customData as ZodTree;
  if (!tree.properties) return;

  for (const [field, node] of Object.entries(tree.properties)) {
    if (node.errors[0]) {
      setError(field as Path<T>, { message: node.errors[0] });
    }
  }
}
