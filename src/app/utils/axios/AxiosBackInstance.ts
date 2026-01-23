import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import axiosRetry from "axios-retry";
import { handleRequestSuccess, handleResponseError, handleTokenExpired } from "./Common";

// Back end axios instance
export const axiosBackInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACK_END_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosRetry(axiosBackInstance, {
  retries: 2,
  retryDelay: () => 1000,
  retryCondition: (error) => {
    // Retry on network errors or 5xx server errors
    return axiosRetry.isNetworkError(error);
  },
});

axiosBackInstance.interceptors.request.use(handleRequestSuccess);
axiosBackInstance.interceptors.response.use((res) => res, handleTokenExpired);

export const addInterceptorsToAxiosBackInstance = ({
  onRequestFulfilled,
  onRequestRejected,
  onResponseFulfilled,
  onResponseRejected,
}: {
  onRequestFulfilled?: (config: InternalAxiosRequestConfig) => Promise<any>;
  onRequestRejected?: (error: AxiosError) => Promise<any>;
  onResponseFulfilled?: (response: AxiosResponse) => Promise<any>;
  onResponseRejected?: (error: AxiosError) => Promise<any>;
}): { requestInterceptorId: number; responseInterceptorId: number } => {
  const requestInterceptorId = axiosBackInstance.interceptors.request.use(
    onRequestFulfilled,
    onRequestRejected,
  );

  const responseInterceptorId = axiosBackInstance.interceptors.response.use(
    onResponseFulfilled,
    onResponseRejected,
  );

  return { requestInterceptorId, responseInterceptorId };
};

export const removeInterceptorsToAxiosBackInstance = ({
  requestInterceptorId,
  responseInterceptorId,
}: {
  requestInterceptorId: number;
  responseInterceptorId: number;
}) => {
  axiosBackInstance.interceptors.request.eject(requestInterceptorId);
  axiosBackInstance.interceptors.response.eject(responseInterceptorId);
};

// axiosBackInstance.interceptors.response.use((res) => res, handleResponseError);
