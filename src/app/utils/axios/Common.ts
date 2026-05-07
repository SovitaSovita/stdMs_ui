import { Settings } from "@/app/constants/type";
import { GridDensity } from "@mui/x-data-grid";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import dayjs, { Dayjs } from "dayjs";
import { getToken } from "next-auth/jwt";
import { getSession, signOut } from "next-auth/react";
import type { Session } from "next-auth";

// In-memory session cache.
// next-auth's getSession() always hits /api/auth/session — without this, every
// axios request triggers a session fetch. We reuse the session while the JWT's
// expiresAt is still in the future, and invalidate on 401 / signOut.
let cachedSession: Session | null = null;
let inFlight: Promise<Session | null> | null = null;
const SAFETY_WINDOW_MS = 30_000; // refetch a bit before expiry

function isSessionFresh(s: Session | null): boolean {
  if (!s?.accessToken) return false;
  if (!s.expiresAt) return true; // no expiry info — trust it for this tick
  return s.expiresAt - SAFETY_WINDOW_MS > Date.now();
}

async function getCachedSession(forceRefresh = false): Promise<Session | null> {
  if (!forceRefresh && isSessionFresh(cachedSession)) return cachedSession;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const s = await getSession();
      cachedSession = s ?? null;
      return cachedSession;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

export function invalidateSessionCache() {
  cachedSession = null;
  inFlight = null;
}

export const handleTokenExpired = async (error: AxiosError) => {
  const status = error.response?.status;
  if (status === 401 && (error?.response?.statusText == "TOKEN_EXPIRED" || error?.code === "ERR_BAD_REQUEST")) {
    // show user notification (client-side only)
    if (typeof window !== "undefined") {
      // avoid infinite redirect: don't redirect if already on signin
      if (!window.location.pathname.startsWith("/signin")) {
        invalidateSessionCache();
        // signOut clears session cookie
        await signOut({ redirect: false });
        localStorage.clear();
        // optional toast: show user what happened
        window.location.href = "/auth/signin";
      }
    }
  }
  return Promise.reject(error);
};

export const handleRequestSuccess = async (
  config: InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> => {
  const session = await getCachedSession();
  const token = session?.accessToken;
  config.headers = config.headers || {};
  if (typeof token === "string" && token.length > 0) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
};

export const handleResponseError = async (error: any) => {
  const { config: originalRequest } = error;
  if (error.response?.status !== 401) {
    return Promise.reject(error);
  }

  // Token may have just expired — invalidate and retry once with a fresh one.
  if (originalRequest && !originalRequest._retried) {
    originalRequest._retried = true;
    invalidateSessionCache();
    const session = await getCachedSession(true);
    const accessToken = session?.accessToken;
    if (typeof accessToken === "string" && accessToken.length > 0) {
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return axios(originalRequest);
    }
  }

  return Promise.reject(error);
};

/**
 * Turns "2025-2026" into:
 *   start: 2025-04-01   (April of the first year)
 *   end:   2026-03-31   (March of the second year)
 *
 * If the two years are the same (e.g. "2025-2025") we treat it as a calendar year.
 */
export function getAcademicYearBounds(yearRange: string | undefined | null): {
  min: Dayjs;
  max: Dayjs;
} {
  if (!yearRange) {
    // fallback – allow the next 12 months
    return { min: dayjs().subtract(3, "month"), max: dayjs().add(3, "month") };
  }
  console.log(yearRange);

  const [startStr, endStr] = yearRange.split("-").map((s) => s.trim());

  const startYear = Number(startStr);
  const endYear = Number(endStr);

  if (Number.isNaN(startYear) || Number.isNaN(endYear)) {
    throw new Error(`Invalid year format: ${yearRange}`);
  }

  // Academic year = April → March
  const min =
    startYear === endYear
      ? dayjs(`${startYear}-01-01`) // calendar year
      : dayjs(`${startYear}-04-01`); // start of academic year

  const max =
    startYear === endYear
      ? dayjs(`${startYear}-12-31`).endOf("day")
      : dayjs(`${endYear}-03-31`).endOf("day"); // end of academic year

  return { min, max };
}

/* --------------------------------------------------------------
   Parse "2025-2026" → Jan 2025 to Dec 2026
   -------------------------------------------------------------- 
*/
export function getFullYearRangeBounds(yearRange: string | undefined | null): {
  min: Dayjs;
  max: Dayjs;
} {
  if (!yearRange) {
    return {
      min: dayjs().subtract(3, "month"),
      max: dayjs().add(3, "month"),
    };
  }

  const [startStr, endStr] = yearRange.split("-").map((s) => s.trim());
  const startYear = Number(startStr) - 1;
  const endYear = Number(endStr) + 1;

  if (Number.isNaN(startYear) || Number.isNaN(endYear)) {
    throw new Error(`Invalid year format: ${yearRange}`);
  }

  // Full calendar months: Jan of start year → Dec of end year
  const min = dayjs(`${startYear}-01-01`).startOf("month");
  const max = dayjs(`${endYear}-12-31`).endOf("month");

  return { min, max };
}

/* --------------------------------------------------------------
    Custom Toolbar Common
   -------------------------------------------------------------- 
*/
export const DENISTY_OPTIONS: { label: string; value: GridDensity }[] = [
  { label: "Compact density", value: "compact" },
  { label: "Standard density", value: "standard" },
  { label: "Comfortable density", value: "comfortable" },
];

export const SETTINGS_STORAGE_KEY = "mui-data-grid-settings";

export const SETTINGS_DEFAULT: Settings = {
  density: "compact",
  showCellBorders: true,
  showColumnBorders: true,
};

export const getInitialSettings = (): Settings => {
  try {
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return storedSettings ? JSON.parse(storedSettings) : SETTINGS_DEFAULT;
  } catch (error) {
    return SETTINGS_DEFAULT;
  }
};


export function truncateDecimal(num: number, digits: number) {
  const multiplier = Math.pow(10, digits);
  return Math.floor(num * multiplier) / multiplier;
}