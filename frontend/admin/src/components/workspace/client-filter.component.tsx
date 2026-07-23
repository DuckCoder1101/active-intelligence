import { useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate, useRouterState, useSearch } from '@tanstack/react-router';

import type { MultiSelectOption } from '@/components/ui/multi-select.component';
import { MultiSelect } from '@/components/ui/multi-select.component';
import { companiesQueryOptions } from '@/queries/company.queries';

export function ClientFilter() {
  const { data: companies } = useSuspenseQuery(companiesQueryOptions());
  const { clients } = useSearch({ from: '/_admin/workspace' });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const selected = clients ? clients.split(',') : [];
  const options: MultiSelectOption[] = companies
    .filter((c) => c.companyStage !== 'inactive')
    .map((c) => ({
      value: c.companyId,
      label: c.displayName,
    }));

  return (
    <div className="w-full sm:w-72">
      <MultiSelect
        label="Clientes"
        options={options}
        selected={selected}
        onChange={(values) =>
          // Stay on whichever workspace tab is currently active — only
          // the `clients` search param changes.
          navigate({
            to: pathname,
            search: (prev) => ({
              ...prev,
              clients: values.length > 0 ? values.join(',') : undefined,
            }),
            replace: true,
          })
        }
      />
    </div>
  );
}
