import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@schoolhub/ui/components/button'
import { Card, CardContent } from '@schoolhub/ui/components/card'
import { CheckCircle2 } from 'lucide-react'
import { colors, dashboardColors } from '../../../styles/colors'

export const Route = createFileRoute('/dashboard/students/success')({
  component: StudentSuccessPage,
})

function StudentSuccessPage() {
  return (
    <main className={`grid min-h-screen place-items-center p-4 ${dashboardColors.page}`}>
      <Card className={`max-w-xl rounded-[28px] text-center ${dashboardColors.card}`}>
        <CardContent className="p-8">
        <CheckCircle2 className={`mx-auto mb-5 h-14 w-14 ${colors.success.icon}`} />
        <h1 className="text-3xl font-bold">Student added successfully.</h1>
        <p className={`mt-3 ${colors.app.muted}`}>This is the dummy success state. API saving can be added when the backend flow is ready.</p>
        <div className="mt-7 flex justify-center gap-3">
          <Button asChild>
            <Link to="/dashboard/$section" params={{ section: 'students' }}>View Students</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/dashboard">Dashboard</Link>
          </Button>
        </div>
        </CardContent>
      </Card>
    </main>
  )
}
