import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/organization')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/organization"!</div>
}
