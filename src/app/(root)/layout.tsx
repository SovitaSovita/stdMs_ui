"use client";
import * as React from "react";
import Dashboard from "../dashboard/Dashboard";

export default function Layout(props: {
  disableCustomTheme?: boolean;
  children: any;
}) {
  const { children } = props;

  return (
    <>
      <Dashboard>{children}</Dashboard>
    </>
  );
}
