"use client";
import * as React from "react";
import Dashboard from "../dashboard/Dashboard";
import { useAuthGuard } from "../libs/auth-utils";
import { AuthLoading } from "../libs/auth-context";

export default function Layout(props: {
  disableCustomTheme?: boolean;
  children: any;
}) {
  const { children } = props;
  const { isAuthenticated } = useAuthGuard({
    requireAuth: true,
    requireAdmin: false
  });

  if (!isAuthenticated) {
    return <AuthLoading />;
  }

  return (
    <>
      <Dashboard>{children}</Dashboard>
    </>
  );
}
