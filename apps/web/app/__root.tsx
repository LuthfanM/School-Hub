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
    <main className="grid min-h-screen place-items-center bg-[#F7F4EE] p-4 text-[#151515]">
      <section className="w-full max-w-lg rounded-[28px] border border-[#E5DED3] bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2563EB]">404</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-3 text-[#6F6A62]">
          The page you opened does not exist or is not available for this workspace.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
