// src/app/api/auth/[...nextauth]/route.js

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getUserRole } from "@/config/roles";

// Función auxiliar para refrescar el token de acceso
async function refreshAccessToken(token) {
  try {
    const url =
      "https://oauth2.googleapis.com/token?" +
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      });

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    console.error("Error refreshing access token", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      try {
        const isAllowedToSignIn = account.provider === "google" && profile.email_verified === true;
        if (!isAllowedToSignIn) {
          console.error(`Sign-in attempt failed: ${profile.email} is not verified or not using Google provider`);
        }
        return isAllowedToSignIn;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      try {
        // Initial sign in
        if (account && user) {
          const role = getUserRole(user.email);
          return {
            accessToken: account.access_token,
            accessTokenExpires: account.expires_at * 1000,
            refreshToken: account.refresh_token,
            user,
            role: role || undefined,
          };
        }

        // Return previous token if the access token has not expired yet
        if (Date.now() < token.accessTokenExpires) {
          return token;
        }

        // Access token has expired, try to update it
        return refreshAccessToken(token);
      } catch (error) {
        console.error("Error in jwt callback:", error);
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },
    async session({ session, token }) {
      try {
        session.user = token.user;
        session.accessToken = token.accessToken;
        session.error = token.error;
        if (token.role) {
          session.user.role = token.role;
        } else {
          console.warn("No role found for user, access will be limited");
        }
        return session;
      } catch (error) {
        console.error("Error in session callback:", error);
        return session;
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };