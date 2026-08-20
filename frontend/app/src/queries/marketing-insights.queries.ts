import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import MarketingInsightsService from '@/services/marketing-insights.service';
import { metaIntegrationKeys } from './meta-integration.queries';

export const marketingInsightsKeys = {
  dashboard: (companyId: string) =>
    ['marketing-insights', 'dashboard', companyId] as const,
};

export const marketingDashboardQueryOptions = (companyId: string) =>
  queryOptions({
    queryKey: marketingInsightsKeys.dashboard(companyId),
    queryFn: () => MarketingInsightsService.getMarketingDashboard(companyId),
  });

export function useSelectFacebookAdAccountMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adAccountId: string) =>
      MarketingInsightsService.selectFacebookAdAccount(companyId, adAccountId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: marketingInsightsKeys.dashboard(companyId),
      });
      queryClient.invalidateQueries({
        queryKey: metaIntegrationKeys.facebookAds(companyId),
      });
    },
  });
}
