import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { Spinner } from '@/components/ui/spinner.component';
import { deleteSession } from '@/server/session';
import UserService from '@/services/user.service';

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
