"use client";

import { usePathname } from "next/navigation";
import DashboardLayout from "../dashboard/DashboardLayout";
import NotificationsProvider from "../libs/hooks/useNotifications/NotificationsProvider";
import DialogsProvider from "../libs/hooks/useDialogs/DialogsProvider";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // ✅ Detect if route is under /auth
  const isAuthRoute = pathname.includes("/auth");

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <DashboardLayout>
      <NotificationsProvider>
        <DialogsProvider>{children}</DialogsProvider>
      </NotificationsProvider>
    </DashboardLayout>
  );
}
