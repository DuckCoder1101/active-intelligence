import { useState, useEffect, useCallback, useRef } from 'react';

import CompanyService from '@/services/company.service';
import { useHandleError } from '@/hooks/useHandleError.util';

import type { Company } from '@/models/company.model';

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const handleError = useHandleError();
  const handleErrorRef = useRef(handleError);
  handleErrorRef.current = handleError;

  const load = useCallback(() => {
    setIsLoading(true);
    CompanyService.listCompanies()
      .then(setCompanies)
      .catch((err) => handleErrorRef.current(err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (companyId: string) => {
    setDeletingId(companyId);
    try {
      await CompanyService.deleteCompany(companyId);
      setCompanies((prev) => prev.filter((c) => c.companyId !== companyId));
    } catch (err) {
      handleErrorRef.current(err);
    } finally {
      setDeletingId(null);
    }
  };

  return { companies, isLoading, deletingId, remove, refresh: load };
}
