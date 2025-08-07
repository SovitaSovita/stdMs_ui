'use client';

import MainGrid from "../dashboard/components/MainGrid";
import { useAuth } from "../libs/auth-context";

export default function Page() {
  const {user} = useAuth();
  console.log("useruser", user);
  return (
    <>
      <MainGrid />
    </>
  );
}
