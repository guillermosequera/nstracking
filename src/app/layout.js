'use client'

import './globals.css'
import { Providers } from '@/components/Providers'
import Navbar from '@/components/Navbar'
import dynamic from 'next/dynamic'

const ErrorBoundary = dynamic(() => import('@/components/ErrorBoundary'), {
  ssr: false
})

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head />
      <body className="min-h-screen bg-white">
        <Providers>
          <ErrorBoundary>
            <div className="min-h-screen">
              <Navbar />
              <main className="container mx-auto px-4 pt-16">
                {children}
              </main>
            </div>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}