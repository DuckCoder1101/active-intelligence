import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import CompanyUserService from '@/services/company-user.service';
import UserService from '@/services/user.service';

export const companyUserKeys = {
  all: ['companyUsers'] as const,
  list: (companyId: string) =>
    [...companyUserKeys.all, 'list', companyId] as const,
};

export const companyUsersQueryOptions = (companyId: string) =>
  queryOptions({
    queryKey: companyUserKeys.list(companyId),
    queryFn: () => CompanyUserService.listCompanyUsers(companyId),
  });

export function useInviteCompanyUserMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      await CompanyUserService.inviteCompanyUser(email, companyId);
      await UserService.sendRecoverPasswordEmail(email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyUserKeys.list(companyId) });
    },
  });
}

export function useDeleteCompanyUserMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uid: string) => UserService.deleteAccount({ targetId: uid }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyUserKeys.list(companyId),
      });
    },
  });
}
