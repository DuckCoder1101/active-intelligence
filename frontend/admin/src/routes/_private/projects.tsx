import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_private/projects')({
  beforeLoad: () => {
    throw redirect({ to: '/workspace/schedule' });
  },
});
