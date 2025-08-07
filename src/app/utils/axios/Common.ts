import axios, { InternalAxiosRequestConfig } from "axios";

export const handleRequestSuccess = async (
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> => {
  const isAdmin = JSON.parse(localStorage.getItem("isAdminMode") || "false");
  const accessToken = isAdmin
    ? localStorage.getItem("accessToken")
    : localStorage.getItem("accessToken");

  config.headers.Authorization = "Bearer " + accessToken;
  return config;
};

export const handleResponseError = async (error: any) => {
  const { config: originalRequest } = error;

  // 인증 실패가 아니거나, 재발급 리퀘스트 실패할 경우
  if (
    error.response?.status !== 401
  ) {
    return Promise.reject(error);
  }

  const isAdmin = JSON.parse(localStorage.getItem("isAdminMode") || "false");

  try {
    const accessToken = isAdmin
      ? localStorage.getItem("accessToken")
      : localStorage.getItem("accessToken");
    if (typeof accessToken === "string") {
      originalRequest.headers.Authorization = "Bearer " + accessToken;
      return axios(originalRequest);
    }
  } catch (e) {
    return Promise.reject(e);
  }

  return Promise.reject(error);
};
