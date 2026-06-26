import { Card, CardContent } from '@schoolhub/ui/components/card'
import { colors, dashboardColors } from '../../styles/colors'

interface RoleNoticeProps {
  blocked: string
  title: string
  visible: string
}

export function RoleNotice({ blocked, title, visible }: RoleNoticeProps) {
  return (
    <Card className={`mb-6 rounded-[24px] ${dashboardColors.card}`}>
      <CardContent className="grid gap-4 p-5 lg:grid-cols-2">
        <div>
          <p className="font-bold">{title}</p>
          <p className={`mt-1 text-sm ${colors.app.muted}`}>Can see: {visible}</p>
        </div>
        <div>
          <p className="font-bold">Restricted</p>
          <p className={`mt-1 text-sm ${colors.app.muted}`}>Cannot see: {blocked}</p>
        </div>
      </CardContent>
    </Card>
  )
}
