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

export const jwt = async ({ token, user }: { token: JWT; user: any }) => {
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

  // If token still valid → keep it
  if (token.expiresAt && token.expiresAt > Date.now()) {
    // console.log("1 >", token.expiresAt);
    // console.log("2 >", Date.now());
    return token;
  }

  // Expired → refresh
  // console.log("call refrect");
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
        const result = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credentials),
        });
        const data = await result.json();
        if (!result.ok) {
          return null;
        }
        return data;
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
