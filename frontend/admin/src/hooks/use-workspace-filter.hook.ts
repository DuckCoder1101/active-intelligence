import { useSuspenseQuery } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { useMemo } from 'react';

import type { Company } from '@/models/company.model';
import { companiesQueryOptions } from '@/queries/company.queries';

interface WorkspaceFilter {
  selectedCompanyIds: string[];
  isSingleClient: boolean;
  singleClient: Company | undefined;
}

export function useWorkspaceFilter(): WorkspaceFilter {
  const { clients } = useSearch({ from: '/_admin/workspace' });
  const { data: companies } = useSuspenseQuery(companiesQueryOptions());

  const selectedCompanyIds = useMemo(() => {
    if (!clients) {
      return [];
    }
    const companyIds = new Set(companies.map((c) => c.companyId));
    return clients.split(',').filter((id) => companyIds.has(id));
  }, [clients, companies]);

  const isSingleClient = selectedCompanyIds.length === 1;
  const singleClient = isSingleClient
    ? companies.find((c) => c.companyId === selectedCompanyIds[0])
    : undefined;

  return { selectedCompanyIds, isSingleClient, singleClient };
}
