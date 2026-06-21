import { useState, useEffect, useRef } from 'react';

import CompanyService from '@/services/company.service';
import { useHandleError } from '@/hooks/useHandleError.util';

import type { CompanyResume } from '@t/company.model';

export function useMyCompanies() {
  const [companies, setCompanies] = useState<CompanyResume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const handleError = useHandleError();
  const handleErrorRef = useRef(handleError);
  handleErrorRef.current = handleError;

  useEffect(() => {
    CompanyService.getMyCompanies()
      .then(setCompanies)
      .catch((err) => handleErrorRef.current(err))
      .finally(() => setIsLoading(false));
  }, []);

  return { companies, isLoading };
}
