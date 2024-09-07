// src/middleware.js
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getUserRole, adminRoles, workerRoles } from './config/roles';

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;

  if (!token) {
    return NextResponse.redirect(new URL('/api/auth/signin', req.url));
  }

  const userRole = getUserRole(token.email);

  if (!userRole && path !== '/status') {
    return NextResponse.redirect(new URL('/status', req.url));
  }

  if (path.startsWith('/admin') && !adminRoles.includes(userRole)) {
      return NextResponse.redirect(new URL('/status', req.url));
  }

  for (const role of workerRoles) {
    if (path.startsWith(`/${role.toLowerCase()}`) && userRole !== role && !adminRoles.includes(userRole)) {
        return NextResponse.redirect(new URL('/status', req.url));
    }
}

    if (path === '/developer/stats' && userRole !== 'adminAdmin') {
      return NextResponse.redirect(new URL('/status', req.url));
    }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/worker/:path*',
    '/status', 
    '/developer/:path*'
  ],
};