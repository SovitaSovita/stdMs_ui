import ResetPassword from "@/app/dashboard/components/ResetPassword";
import React, { Suspense } from "react";

export default function Page() {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPassword />
      </Suspense>
    </>
  );
}
