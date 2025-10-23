"use client";

import MainGrid from "../dashboard/components/MainGrid";
import DashboardLayout from "../dashboard/DashboardLayout";

export default function Page() {
  return (
    <>
      <DashboardLayout>
        <MainGrid />
      </DashboardLayout>
    </>
  );
}
