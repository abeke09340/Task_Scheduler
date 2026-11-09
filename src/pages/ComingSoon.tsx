import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'

export function ComingSoon({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <Card className="mt-6 px-6 py-12 text-center">
        <p className="text-body text-muted">Раздел появится на следующем этапе.</p>
      </Card>
    </>
  )
}

