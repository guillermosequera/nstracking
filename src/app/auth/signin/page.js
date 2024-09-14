'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function SignIn() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  console.log('callbackUrl', callbackUrl);

  const handleSignIn = async () => {
    const result = await signIn('google', { callbackUrl })
    console.log('result', result);
  }
    

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-6 max-w-sm w-full bg-white shadow-md rounded-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Iniciar sesión</h1>
        <button
          onClick={handleSignIn}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Iniciar sesión con Google
        </button>
      </div>
    </div>
  )
}