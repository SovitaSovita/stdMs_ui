import axios, { InternalAxiosRequestConfig } from "axios";
import { getSession } from "next-auth/react";

export const handleRequestSuccess = async (
  config: InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> => {
  const session = await getSession();
  // const isAdmin = JSON.parse(localStorage.getItem("isAdminMode") || "false");
  const accessToken = session?.token

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
