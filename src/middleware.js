import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getUserRole, adminRoles, workerRoles } from './config/roles';

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;

  console.log('Middleware:', path, token);
  

  if (path.startsWith('/auth/signin')) {
    return NextResponse.next();
  }


  if (!token) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  const userRole = getUserRole(token.email);
  console.log('Middleware: User Role', userRole);
  

  // Redirect to appropriate page if user is at root
  if (path === '/') {
    if (adminRoles.includes(userRole)) {
      return NextResponse.redirect(new URL('/admin', req.url));
    } else if (workerRoles.includes(userRole)) {
      return NextResponse.redirect(new URL(`/worker/${userRole.toLowerCase()}`, req.url));
    } else {
      return NextResponse.redirect(new URL('/status', req.url));
    }
  }

  // Protect admin routes
  if (path.startsWith('/admin') && !adminRoles.includes(userRole)) {
    return NextResponse.redirect(new URL('/status', req.url));
  }

  // Protect worker routes
  if (path.startsWith('/worker')) {
    const workerType = path.split('/')[2];
    const requiredRole = `worker${workerType.charAt(0).toUpperCase() + workerType.slice(1)}`;
    if (userRole !== requiredRole && !adminRoles.includes(userRole)) {
      return NextResponse.redirect(new URL('/status', req.url));
    }
  }

  // Special case for developer stats
  if (path === '/developer/stats' && userRole !== 'adminAdmin') {
    return NextResponse.redirect(new URL('/status', req.url));
  }

  // If no role is assigned, only allow access to status page
  if (!userRole && path !== '/status') {
    return NextResponse.redirect(new URL('/status', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/worker/:path*',
    '/status', 
    '/developer/:path*',
    '/auth/signin',
  ],
};