import { LoginResponseTypes } from "@/app/constants/type";
import { Session, getServerSession, type NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACK_END_URL as string;

export function auth() {
    return getServerSession(options);
}

export type Token = {
    expired: string;
    token: string;
    username: string;
    dateTime: string;
};
declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as
     * a prop on the `SessionProvider` React Context
     */
    interface Session {
        token?: Token;
    }
}

declare module "next-auth/jwt" {
    /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
    interface JWT {
        dateTime?: string;
        username?: string;
        token?: string;
        role?: string;
        fullname?: string;
        email?: string;
        profile?: string;
    }
}

export const jwt = async ({ token, user }: { token: JWT; user: any }) => {
    if (user) {
        token.dateTime = user.dateTime;
        token.username = user.username;
        token.token = user.token;
        token.role = user.role;
        token.fullname = user.fullname;
        token.email = user.email;
        token.profile = user.profile;
    }
    return token;
};

export const session = ({ session, token }: {
    session: any;
    token: JWT;
    user: any;
}): Promise<Session> => {
    if (token) {
        session.dateTime = token.dateTime;
        session.user.username = token.username;
        session.token = token.token;
        session.user.role = token.role;
        session.user.fullname = token.fullname;
        session.user.email = token.email;
        session.user.profile = token.profile;
    }
    return Promise.resolve(session);
};

export const options: NextAuthOptions = {
    providers: [
        // GoogleProvider({
        //     clientId: process.env.GOOGLE_CLIENT_ID as string,
        //     clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        //     async profile(profile) {

        //         // console.log("profile ?>>>>>", profile);

        //         const result = await fetch(`${API_BASE_URL}/api/v1/auth/social`, {
        //             method: "POST",
        //             headers: {
        //                 'Content-Type': 'application/json',
        //             },
        //             body: JSON.stringify({
        //                 gmail: profile?.email,
        //                 appId: "2"
        //             })
        //         })
        //         const data = await result.json();
        //         const token = data.payload;
        //         return {
        //             id: token.id,
        //             userId: token.userId,
        //             token: token.token,
        //             clph_NO: token.clph_NO,
        //             dvsn_CD: token.dvsn_CD,
        //             dvsn_NM: token.dvsn_NM,
        //             jbcl_NM: token.jbcl_NM,
        //             eml: token.eml,
        //             flnm: token.flnm,
        //             prfl_PHTG: token.prfl_PHTG,
        //         };
        //     },

        // }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "text" },
            },
            async authorize(credentials) {
                const result = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(credentials)
                })
                const data = await result.json();
                // console.log("data >> ", data);
                if (result.ok) {
                    return data;
                }
                else {
                    return null;
                }
            }
        })
    ],
    callbacks: {
        session,
        jwt,
    },
    pages: {
        signIn: "/auth/signin"
    }
}