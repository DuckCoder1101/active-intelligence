import { createFileRoute } from '@tanstack/react-router';

import { Unauthorized } from '@/components/ui/unauthorized.component';

export const Route = createFileRoute('/app/unauthorized')({
  component: Unauthorized,
});
