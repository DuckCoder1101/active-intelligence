import { useState, useEffect, useCallback, useRef } from 'react';

import AdminService from '@/services/admin.service';
import type { UpdateAdminDTO } from '@/services/admin.service';
import { useHandleError } from '@/hooks/useHandleError.util';

import type { AdminProfile, AdminAccessLevel } from '@/models/admin.model';
import type { AdminPermission } from '@/types/permissions.type';

export function useAdmins() {
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const handleError = useHandleError();
  const handleErrorRef = useRef(handleError);
  handleErrorRef.current = handleError;

  const load = useCallback(() => {
    setIsLoading(true);
    AdminService.listAdmins()
      .then(setAdmins)
      .catch((err) => handleErrorRef.current(err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (uid: string) => {
    setDeletingId(uid);
    try {
      await AdminService.deleteAdmin(uid);
      setAdmins((prev) => prev.filter((u) => u.uid !== uid));
    } catch (err) {
      handleErrorRef.current(err);
    } finally {
      setDeletingId(null);
    }
  };

  const updateAccessLevel = async (uid: string, newAccessLevel: AdminAccessLevel) => {
    try {
      await AdminService.updateAccessLevel(uid, newAccessLevel);
      setAdmins((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, accessLevel: newAccessLevel } : u)),
      );
    } catch (err) {
      handleErrorRef.current(err);
      throw err;
    }
  };

  const updateAdmin = async (data: UpdateAdminDTO) => {
    try {
      await AdminService.updateAdmin(data);
      setAdmins((prev) =>
        prev.map((u) => (u.uid === data.targetId ? { ...u, ...data } : u)),
      );
    } catch (err) {
      handleErrorRef.current(err);
      throw err;
    }
  };

  const updatePermissions = async (uid: string, permissions: AdminPermission[]) => {
    try {
      await AdminService.updatePermissions(uid, permissions);
      setAdmins((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, permissions } : u)),
      );
    } catch (err) {
      handleErrorRef.current(err);
      throw err;
    }
  };

  const patchAdmin = (uid: string, updates: Partial<AdminProfile>) => {
    setAdmins((prev) => prev.map((u) => (u.uid === uid ? { ...u, ...updates } : u)));
  };

  return {
    admins,
    isLoading,
    deletingId,
    remove,
    updateAccessLevel,
    updatePermissions,
    updateAdmin,
    patchAdmin,
    refresh: load,
  };
}
