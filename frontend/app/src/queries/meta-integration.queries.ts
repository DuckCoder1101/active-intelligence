import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import MetaIntegrationService from '@/services/meta-integration.service';

export const metaIntegrationKeys = {
  facebookAds: (companyId: string) =>
    ['meta-integration', 'facebook-ads', companyId] as const,
};

export const facebookAdsSettingsQueryOptions = (companyId: string) =>
  queryOptions({
    queryKey: metaIntegrationKeys.facebookAds(companyId),
    queryFn: () => MetaIntegrationService.getFacebookAdsSettings(companyId),
  });

export function useConnectFacebookAdsMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accessToken: string) =>
      MetaIntegrationService.connectFacebookAds(companyId, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: metaIntegrationKeys.facebookAds(companyId),
      });
    },
  });
}

export function useDisconnectFacebookAdsMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => MetaIntegrationService.disconnectFacebookAds(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: metaIntegrationKeys.facebookAds(companyId),
      });
    },
  });
}
