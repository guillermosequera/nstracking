'use client'

import './globals.css'
import { useState } from 'react';
import dynamic from 'next/dynamic'
import { initErrorHandling } from '@/utils/errorHandler'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { SessionProvider } from 'next-auth/react'

const ErrorBoundary = dynamic(() => import('@/components/ErrorBoundary'), {
  ssr: false
})

function Layout({ children }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <SessionProvider>
            <Layout>{children}</Layout>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}