import { Settings } from "@/app/constants/type";
import { GridDensity } from "@mui/x-data-grid";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import dayjs, { Dayjs } from "dayjs";
import { getSession, signOut } from "next-auth/react";

export const handleTokenExpired = async (error: AxiosError) => {
  if (error.response?.status === 403) {
    // Clear session
    await signOut({ redirect: true, callbackUrl: "/signin" });
    
    // Clear any stored data
    localStorage.removeItem("selectedClassroomId");
    sessionStorage.clear();
    
    // Redirect to login
    // window.location.href = "/signin";
    
    // Optional: Show notification
    // toast.error("Your session has expired. Please sign in again.");
  }
  
  return Promise.reject(error);
};

export const handleRequestSuccess = async (
  config: InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> => {
  const session = await getSession();
  // const isAdmin = JSON.parse(localStorage.getItem("isAdminMode") || "false");
  const accessToken = session?.token;

  config.headers.Authorization = "Bearer " + accessToken;
  return config;
};

export const handleResponseError = async (error: any) => {
  const { config: originalRequest } = error;
  const session = await getSession();
  // 인증 실패가 아니거나, 재발급 리퀘스트 실패할 경우
  if (error.response?.status !== 401) {
    return Promise.reject(error);
  }

  // const isAdmin = JSON.parse(localStorage.getItem("isAdminMode") || "false");

  try {
    const accessToken = session?.token;
    if (typeof accessToken === "string") {
      originalRequest.headers.Authorization = "Bearer " + accessToken;
      return axios(originalRequest);
    }
  } catch (e) {
    return Promise.reject(e);
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
  const startYear = Number(startStr);
  const endYear = Number(endStr);

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
  density: "standard",
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
