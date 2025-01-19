'use client'

import './globals.css'
import { Providers } from '@/components/Providers'
import Navbar from '@/components/Navbar'
import dynamic from 'next/dynamic'
import { syncScheduler } from '@/services/syncScheduler'
import { Analytics } from "@vercel/analytics/react"

const ErrorBoundary = dynamic(() => import('@/components/ErrorBoundary'), {
  ssr: false
})

// Iniciar el programador solo en el lado del cliente
if (typeof window !== 'undefined') {
  syncScheduler.start()
}

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
              <Analytics />
            </div>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}