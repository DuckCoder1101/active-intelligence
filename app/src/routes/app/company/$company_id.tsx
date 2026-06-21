import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/company/$company_id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/organization/$organization_id"!</div>
}
