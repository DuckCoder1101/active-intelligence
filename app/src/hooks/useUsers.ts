import { useState, useEffect, useCallback, useRef } from 'react';

import UserService from '@/services/user.service';
import { useHandleError } from '@/hooks/useHandleError.util';

import type { UserProfile, UserAccessLevel } from '@/models/user.model';
import type { AdminPermission } from '@/types/permissions.type';
import type { UpdateUserDTO } from '@/services/user.service';

export function useUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const handleError = useHandleError();
  const handleErrorRef = useRef(handleError);
  handleErrorRef.current = handleError;

  const load = useCallback(() => {
    setIsLoading(true);
    UserService.listUsers()
      .then(setUsers)
      .catch((err) => handleErrorRef.current(err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (uid: string) => {
    setDeletingId(uid);
    try {
      await UserService.deleteUser(uid);
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
    } catch (err) {
      handleErrorRef.current(err);
    } finally {
      setDeletingId(null);
    }
  };

  const updateAccessLevel = async (
    uid: string,
    newAccessLevel: UserAccessLevel,
  ) => {
    try {
      await UserService.updateAccessLevel(uid, newAccessLevel);
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === uid ? { ...u, accessLevel: newAccessLevel } : u,
        ),
      );
    } catch (err) {
      handleErrorRef.current(err);
      throw err;
    }
  };

  const updateUser = async (data: UpdateUserDTO) => {
    try {
      await UserService.updateUser(data);
      setUsers((prev) =>
        prev.map((u) => (u.uid === data.targetUid ? { ...u, ...data } : u)),
      );
    } catch (err) {
      handleErrorRef.current(err);
      throw err;
    }
  };

  const updatePermissions = async (
    uid: string,
    permissions: AdminPermission[],
  ) => {
    try {
      await UserService.updatePermissions(uid, permissions);
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, permissions } : u)),
      );
    } catch (err) {
      handleErrorRef.current(err);
      throw err;
    }
  };

  const patchUser = (uid: string, updates: Partial<UserProfile>) => {
    setUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, ...updates } : u)),
    );
  };

  return {
    users,
    isLoading,
    deletingId,
    remove,
    updateAccessLevel,
    updatePermissions,
    updateUser,
    patchUser,
    refresh: load,
  };
}
