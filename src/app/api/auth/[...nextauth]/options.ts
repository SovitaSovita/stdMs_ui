import { Session, getServerSession, type NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACK_END_URL as string;

export function auth() {
  return getServerSession(options);
}

export type Token = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // ISO string
  username: string;
};

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    expiresAt?: number;
    user: {
      username: string;
      role?: string;
      fullname?: string;
      email?: string;
      profile?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    username?: string;
    role?: string;
    fullname?: string;
    email?: string;
    profile?: string;
  }
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refreshToken: token.refreshToken,
      }),
    });

    const data = await res.json();

    if (!res.ok) throw data;

    return {
      ...token,
      accessToken: data.accessToken,
      expiresAt: data.expiresAt,
    };
  } catch (error) {
    console.error("Refresh token error", error);
    return {
      ...token,
      accessToken: undefined,
      expiresAt: undefined,
    };
  }
}

export const jwt = async ({
  token,
  user,
  trigger,
  session,
}: {
  token: JWT;
  user: any;
  trigger?: "signIn" | "signUp" | "update";
  session?: any;
}) => {
  // First login
  if (user) {
    return {
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
      expiresAt: user.expiresAt,
      username: user.username,
      role: user.role,
      fullname: user.fullname,
      email: user.email,
      profile: user.profile,
    };
  }

  // Profile update from client via useSession().update({...}).
  // Only the whitelisted user-profile fields are merged in.
  if (trigger === "update" && session) {
    return {
      ...token,
      fullname: session.fullname ?? token.fullname,
      email: session.email ?? token.email,
      profile: session.profile ?? token.profile,
    };
  }

  // If token still valid → keep it
  if (token.expiresAt && token.expiresAt > Date.now()) {
    return token;
  }

  // Expired → refresh
  return await refreshAccessToken(token);
};

export const session = async ({
  session,
  token,
}: {
  session: Session;
  token: JWT;
}) => {
  session.accessToken = token.accessToken;
  session.expiresAt = token.expiresAt;

  session.user.username = token.username!;
  session.user.role = token.role;
  session.user.fullname = token.fullname;
  session.user.email = token.email;
  session.user.profile = token.profile;

  return session;
};

export const options: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "text" },
      },
      async authorize(credentials) {
        try {
          const result = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
          });
          const data = await result.json().catch(() => ({}));
          if (!result.ok) {
            // Surface the API's message to the client through next-auth's
            // result.error (signIn with redirect:false returns it).
            throw new Error(
              data?.message ||
                `Authentication failed (status ${result.status})`
            );
          }
          return data;
        } catch (err: any) {
          if (err instanceof Error && err.message) throw err;
          throw new Error("Unable to reach authentication server");
        }
      },
    }),
  ],
  callbacks: {
    session,
    jwt,
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
};
