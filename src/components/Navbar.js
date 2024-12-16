'use client'

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { getUserRole } from '@/config/roles'
import { getUserName } from '@/utils/userUtils'
import { Home, LogOut } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isHovered, setIsHovered] = useState(false)

  const isActive = (path) => {
    return pathname === path ? 'bg-slate-200' : ''
  }

  const userName = session?.user?.email ? getUserName(session.user.email) : 'Anónimo'

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-xl border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex space-x-4">
            <Link
              href="/status"
              className={`px-3 py-2 rounded-md text-sm font-bold hover:no-underline hover:bg-slate-300 ${isActive('/status')}`}
            >
              Estado
            </Link>
            
            <Link
              href="/delayed"
              className={`px-3 py-2 rounded-md text-sm font-bold hover:no-underline hover:bg-slate-300 ${isActive('/delayed')}`}
            >
              Atrasados
            </Link>
          </div>
          
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link
              href="/"
              className={`inline-flex items-center justify-center p-2 rounded-full ${isActive('/')}`}
              aria-label="Ir a página principal"
            >
              <Home className="h-6 w-6 rounded-md hover:bg-slate-300" />
            </Link>
          </div>
          
          {session && (
            <div className="flex items-center space-x-4">
              <div
                className="relative w-24 text-center"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <div className="relative h-6 cursor-pointer">
                  <span 
                    className={`absolute inset-0 flex items-center font-bold text-blue-600 justify-center transition-opacity duration-300 ${
                      isHovered ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    {userName}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                      isHovered ? 'opacity-100' : 'opacity-0'
                    }`}
                    aria-label="Cerrar sesión"
                  >
                    <LogOut className="h-5 w-5 text-slate-600 hover:text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
} 