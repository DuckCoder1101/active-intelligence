import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_admin/projects')({
  beforeLoad: () => {
    throw redirect({ to: '/workspace/schedule' });
  },
});
