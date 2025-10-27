"use client";
import { SessionProvider } from "next-auth/react";
import React, { ReactNode } from "react";
import { fetcher } from "./libs/swr/fetcher";
import { SWRConfig } from "swr";
import AlertSnackbar from "./dashboard/components/alert/AlertSnackbar";

interface Props {
  children: ReactNode;
}

function Provider(props: Props) {
  const { children } = props;
  return (
    <SessionProvider>
        <SWRConfig
          value={{
            fetcher,
            revalidateOnFocus: false,
            dedupingInterval: 10000,
          }}
        >
          <AlertSnackbar />
          {children}
        </SWRConfig>
    </SessionProvider>
  );
}

export default Provider;
