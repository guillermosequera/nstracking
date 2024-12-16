// src/app/api/auth/[...nextauth]/route.js
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getUserRole } from '@/config/roles';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      console.log('Iniciando proceso de signIn:', user.email);
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // Obtener el rol usando la función actualizada
        const role = getUserRole(user.email);
        console.log('JWT Callback - Email:', user.email, 'Role asignado:', role);
        token.role = role;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role;
        console.log('Session Callback - Usuario:', session.user.email, 'Role:', session.user.role);
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
});

export { handler as GET, handler as POST };