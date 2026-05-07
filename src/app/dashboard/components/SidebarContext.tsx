"use client";

import * as React from "react";

type SidebarContextValue = {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
  width: number;
  collapsedWidth: number;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = "sidebarCollapsed";
export const SIDEBAR_WIDTH = 256;
export const SIDEBAR_COLLAPSED_WIDTH = 72;

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = React.useState<boolean>(false);

  // Load persisted state on mount.
  React.useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "1") setCollapsedState(true);
    } catch {
      /* ignore */
    }
  }, []);

  const setCollapsed = React.useCallback((v: boolean) => {
    setCollapsedState(v);
    try {
      localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = React.useCallback(
    () => setCollapsed(!collapsed),
    [collapsed, setCollapsed]
  );

  const value = React.useMemo<SidebarContextValue>(
    () => ({
      collapsed,
      toggle,
      setCollapsed,
      width: SIDEBAR_WIDTH,
      collapsedWidth: SIDEBAR_COLLAPSED_WIDTH,
    }),
    [collapsed, toggle, setCollapsed]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) {
    // Fallback when used outside the provider (shouldn't happen in practice).
    return {
      collapsed: false,
      toggle: () => {},
      setCollapsed: () => {},
      width: SIDEBAR_WIDTH,
      collapsedWidth: SIDEBAR_COLLAPSED_WIDTH,
    };
  }
  return ctx;
}
