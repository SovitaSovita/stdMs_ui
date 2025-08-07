// import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
// import axiosRetry from "axios-retry";
// import { handleRequestSuccess, handleResponseError } from "./Common";

// // Front end axios instance
// export const axiosFrontInstance: AxiosInstance = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_FRONT_END_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// axiosRetry(axiosFrontInstance, {
//   retries: 2,
//   retryDelay: () => 1000,
//   retryCondition: (error) => {
//     // 네트워크 오류나 5xx 서버 오류에 대해 재시도
//     return axiosRetry.isNetworkError(error);
//   },
// });

// axiosFrontInstance.interceptors.request.use(handleRequestSuccess);
// axiosFrontInstance.interceptors.request.use(
//   async (
//     config: InternalAxiosRequestConfig,
//   ): Promise<InternalAxiosRequestConfig> => {
//     const isAdmin = JSON.parse(localStorage.getItem("isAdminMode") || "false");
//     const accessToken = isAdmin
//       ? localStorage.getItem("accessToken")
//       : localStorage.getItem("accessToken");
//     config.headers.Authorization = accessToken;
//     return config;
//   },
// );
// axiosFrontInstance.interceptors.response.use((res) => res, handleResponseError);
