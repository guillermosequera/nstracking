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
      if (userRole === 'adminRRHH') {
        console.log('Redirecting adminRRHH to /admin/rrhh');
        return NextResponse.redirect(new URL('/admin/rrhh', req.url));
      }
      if (userRole === 'adminProduction') {
        console.log('Redirecting adminProduction to /admin/production');
        return NextResponse.redirect(new URL('/admin/production', req.url));
      }
      console.log('Redirecting admin to /admin');
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
  if (path.startsWith('/admin')) {
    if (!adminRoles.includes(userRole)) {
      console.log('Unauthorized access to admin route, redirecting to /status');
      return NextResponse.redirect(new URL('/status', req.url));
    }
    
    // Agregar protección específica para production-matrix
    if (path.startsWith('/api/production-matrix') && userRole !== 'adminProduction') {
      return new NextResponse(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }

    if (userRole === 'adminRRHH') {
      if (!path.startsWith('/admin/rrhh')) {
        console.log('Redirecting adminRRHH to /admin/rrhh');
        return NextResponse.redirect(new URL('/admin/rrhh', req.url));
      }
    } else {
      // For other admin roles, prevent access to /admin/rrhh
      if (path.startsWith('/admin/rrhh')) {
        console.log('Unauthorized access to adminRRHH route, redirecting to /admin');
        return NextResponse.redirect(new URL('/admin', req.url));
      }
    }
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
    '/delayed',
    '/developer/:path*',
    '/auth/signin',
  ],
};