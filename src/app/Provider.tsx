"use client";
import React, { ReactNode } from "react";
import { AuthProvider, useAuth } from "./libs/auth-context";

interface Props {
  children: ReactNode;
}

function Provider(props: Props) {
  const { children } = props;
  return (
    <AuthProvider>{children}</AuthProvider>
  );
}

export default Provider;
