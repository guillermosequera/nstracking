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

  // Add role to token
  token.role = userRole;

  // Redirect to appropriate page if user is at root
  if (path === '/') {
    if (adminRoles.includes(userRole)) {
      return NextResponse.redirect(new URL('/admin', req.url));
    } else if (workerRoles.includes(userRole)) {
      let workerPath;
      switch (userRole) {
        case 'workerWareHouse':
          workerPath = '/worker/warehouse';
          break;
        case 'workerLabsMineral':
          workerPath = '/worker/labs-mineral';
          break;
        case 'workerLabsAR':
          workerPath = '/worker/labs-ar';
          break;
        default:
          workerPath = `/worker/${userRole.toLowerCase().replace('worker', '')}`;
      }
      return NextResponse.redirect(new URL(workerPath, req.url));
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
    let requiredRole;
    switch (workerType) {
      case 'warehouse':
        requiredRole = 'workerWareHouse';
        break;
      case 'labs-mineral':
        requiredRole = 'workerLabsMineral';
        break;
      case 'labs-ar':
        requiredRole = 'workerLabsAR';
        break;
      default:
        requiredRole = `worker${workerType.charAt(0).toUpperCase() + workerType.slice(1)}`;
    }
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

  // Modify the response to include the updated token
  const response = NextResponse.next();
  response.headers.set('x-user-role', userRole);
  return response;
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