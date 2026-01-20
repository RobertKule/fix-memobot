// src/app/proxy.ts (ou src/middleware.ts selon votre version)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  console.log('Middleware executing for:', request.nextUrl.pathname);
  
  // DÉSACTIVEZ TEMPORAIREMENT la redirection pour tester
  return NextResponse.next();
  
  /*
  // Version originale - À RÉACTIVER PLUS TARD
  const token = request.cookies.get('access_token')?.value;
  
  // Pour debug, permettez l'accès au dashboard
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('Dashboard access requested, token in cookie:', !!token);
    // Laisser passer même sans token - le frontend gérera la redirection
  }

  return NextResponse.next();
  */
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register'
  ]
}