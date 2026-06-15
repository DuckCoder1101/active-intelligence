import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/user/profile')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/client/profile"!</div>;
}
