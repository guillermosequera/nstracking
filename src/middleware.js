// src/middleware.js
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { authorizationService } from '@/services/AuthorizationService';
import { routeService } from '@/services/RouteService';
import { roleService } from '@/services/roleService';
import { roleCache } from '@/services/roleCache';

export async function middleware(req) {
  const path = req.nextUrl.pathname;
  
  if (routeService.isPublicRoute(path)) {
    return NextResponse.next();
  }

  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return redirectToSignIn(req);
    }

    if (token.exp < Date.now() / 1000) {
      return redirectToSignIn(req);
    }

    const userRoles = await roleService.getUserRoles(token.email);

    if (!userRoles || userRoles.length === 0) {
      return redirectToStatus(req);
    }

    if (path === '/') {
      const availableViews = roleService.getAvailableViews(userRoles);
      if (availableViews.length > 0) {
        return NextResponse.redirect(new URL(availableViews[0], req.url));
      }
      return redirectToStatus(req);
    }

    const hasAccess = userRoles.some(role => authorizationService.canAccessRoute(role, path));
    if (!hasAccess) {
      return redirectToStatus(req);
    }

    const response = NextResponse.next();
    response.headers.set('x-user-roles', JSON.stringify(userRoles));
    return response;
  } catch (error) {
    console.error('Error in middleware:', error);
    return redirectToSignIn(req);
  }
}

function redirectToSignIn(req) {
  return NextResponse.redirect(new URL('/auth/signin', req.url));
}

function redirectToStatus(req) {
  return NextResponse.redirect(new URL('/status', req.url));
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