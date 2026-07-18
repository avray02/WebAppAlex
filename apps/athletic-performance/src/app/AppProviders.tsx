import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@webappalex/auth'
import { useState, type ReactNode } from 'react'
import { HashRouter } from 'react-router-dom'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </HashRouter>
  )
}
