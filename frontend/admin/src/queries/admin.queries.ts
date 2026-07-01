import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import type { AdminProfile } from '@/models/admin.model';
import AdminService from '@/services/admin.service';
import type { UpdateAdminDTO } from '@/services/admin.service';
import UserService from '@/services/user.service';
import type { AdminPermission } from '@/types/permissions.type';

export const adminKeys = {
  all: ['admins'] as const,
  lists: () => [...adminKeys.all, 'list'] as const,
};

export const adminsQueryOptions = () =>
  queryOptions({
    queryKey: adminKeys.lists(),
    queryFn: () => AdminService.listAdmins(),
  });

export function useInviteAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      await AdminService.inviteAdmin(email);
      await UserService.sendRecoverPasswordEmail(email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

export function useUpdateAdminInfoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateAdminDTO) => AdminService.updateAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

interface UpdatePermissionsVars {
  uid: string;
  permissions: AdminPermission[];
}

export function useUpdatePermissionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uid, permissions }: UpdatePermissionsVars) =>
      AdminService.updatePermissions(uid, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

export function useDeleteAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uid: string) => AdminService.deleteAdmin(uid),
    onMutate: async (uid) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.lists() });

      const previous = queryClient.getQueryData<AdminProfile[]>(
        adminKeys.lists(),
      );

      queryClient.setQueryData<AdminProfile[]>(adminKeys.lists(), (old) =>
        old?.filter((u) => u.uid !== uid),
      );

      return {
        previous,
      };
    },
    onError: (_err, _uid, context) => {
      if (context?.previous) {
        queryClient.setQueryData(adminKeys.lists(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}
