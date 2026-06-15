import { useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

import UserService from '@/services/user.service';
import { deleteSession } from '@/server/session';
import { Spinner } from '@/components/ui/spinner.component';

export const Route = createFileRoute('/auth/logout')({
  component: LogoutPage,
  beforeLoad: async () => {
    await deleteSession();
  },
});

function LogoutPage() {
  const navigate = useNavigate();

  useEffect(() => {
    UserService.signout().finally(() => {
      navigate({ to: '/auth/signin' });
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <Spinner size={20} className="text-primary" />
    </div>
  );
}
