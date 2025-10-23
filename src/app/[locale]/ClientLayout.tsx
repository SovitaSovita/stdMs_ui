"use client";

import { usePathname } from "next/navigation";
import DashboardLayout from "../dashboard/DashboardLayout";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // ✅ Detect if route is under /auth
  const isAuthRoute = pathname.includes("/auth");

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}