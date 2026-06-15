import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/organization/$organization_id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/organization/$organization_id"!</div>
}
