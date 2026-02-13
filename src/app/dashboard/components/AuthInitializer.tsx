"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { setAccessToken } from "@/app/libs/tokenStore";

export default function AuthInitializer() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.accessToken) {
      setAccessToken(session.accessToken);
    }

    if (status === "unauthenticated") {
      setAccessToken(null);
    }
  }, [session, status]);

  return null; // nothing renders
}
