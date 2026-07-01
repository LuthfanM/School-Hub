import type { ReactNode } from 'react'
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { Button } from '@schoolhub/ui/components/button'
import appCss from './globals.css?url'
import '../lib/i18n'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'SchoolHub - Multi-Tenant LMS',
      },
      {
        name: 'description',
        content: 'A modern learning management system for organizations',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function NotFoundComponent() {
  return (
    <main className="schoolhub-page grid min-h-[100dvh] place-items-center p-4 text-[#15313a]">
      <section className="w-full max-w-lg rounded-[2rem] border border-[#d8e5df] bg-white/92 p-8 text-center shadow-[0_24px_70px_rgba(18,52,59,0.10)]">
        <p className="text-sm font-bold text-[#1d6d54]">404</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-3 text-[#526a70]">
          The page you opened does not exist or is not available for this workspace.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="rounded-full bg-[#12343b] text-white hover:bg-[#1d4b52]">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-[#d8e5df] bg-white/82">
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
