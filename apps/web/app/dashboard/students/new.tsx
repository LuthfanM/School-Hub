import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@schoolhub/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@schoolhub/ui/components/card'
import { Input } from '@schoolhub/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@schoolhub/ui/components/select'
import { Textarea } from '@schoolhub/ui/components/textarea'
import { ArrowLeft, Upload } from 'lucide-react'
import { colors, dashboardColors } from '../../../styles/colors'

export const Route = createFileRoute('/dashboard/students/new')({
  component: AddStudentPage,
})

function AddStudentPage() {
  return (
    <main className={`min-h-screen p-4 sm:p-8 ${dashboardColors.page}`}>
      <div className="mx-auto max-w-3xl">
        <Link to="/dashboard" className={`mb-5 inline-flex items-center gap-2 text-sm font-semibold ${colors.app.muted} ${colors.app.foregroundHover}`}>
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <Card className={`rounded-[28px] ${dashboardColors.card}`}>
          <CardHeader className="p-6 sm:p-8">
            <CardDescription className={`font-bold uppercase tracking-[0.18em] ${colors.brand.text}`}>Students</CardDescription>
            <CardTitle className="text-4xl">Add Student</CardTitle>
            <CardDescription className={`text-base ${colors.app.muted}`}>Dummy form state for adding a first student. Submit routes to the success screen.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 sm:p-8 sm:pt-0">
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {['Full name', 'Email address', 'Parent phone'].map((label) => (
              <label key={label} className="space-y-2 text-sm font-semibold">
                <span>{label}</span>
                <Input className={`h-12 rounded-2xl ${dashboardColors.panel}`} placeholder={label} />
              </label>
            ))}
            <label className="space-y-2 text-sm font-semibold">
              <span>Class</span>
              <Select defaultValue="grade-8a">
                <SelectTrigger className={`h-12 rounded-2xl ${dashboardColors.panel}`}>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grade-7b">Grade 7B</SelectItem>
                  <SelectItem value="grade-8a">Grade 8A</SelectItem>
                  <SelectItem value="grade-9a">Grade 9A</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>
          <label className="mt-4 block space-y-2 text-sm font-semibold">
            <span>Notes</span>
            <Textarea className={`min-h-28 rounded-2xl ${dashboardColors.panel}`} placeholder="Learning needs, parent preference, or admin notes" />
          </label>
          <div className={`mt-5 rounded-2xl border border-dashed p-5 ${colors.app.borderDashed} ${colors.app.background}`}>
            <Upload className={`mb-3 h-6 w-6 ${colors.brand.icon}`} />
            <p className="font-semibold">Import CSV</p>
            <p className={`text-sm ${colors.app.muted}`}>File upload placeholder for bulk student import.</p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link to="/dashboard/students/success">Add Student</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/dashboard/$section" params={{ section: 'students' }}>Cancel</Link>
            </Button>
          </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
