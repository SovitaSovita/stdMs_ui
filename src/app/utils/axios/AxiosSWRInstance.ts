import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import axiosRetry from "axios-retry";
import { handleRequestSuccess } from "./Common";

// SWR axios instance
export const axiosSWRInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACK_END_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosRetry(axiosSWRInstance, {
  retries: 3,
  retryDelay: () => 1000,
  retryCondition: (error) => {
    // 네트워크 오류나 5xx 서버 오류에 대해 재시도
    return axiosRetry.isNetworkError(error);
  },
});

axiosSWRInstance.interceptors.request.use(handleRequestSuccess);

export const addInterceptorsToAxiosSWRInstance = ({
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
  const requestInterceptorId = axiosSWRInstance.interceptors.request.use(
    onRequestFulfilled,
    onRequestRejected,
  );

  const responseInterceptorId = axiosSWRInstance.interceptors.response.use(
    onResponseFulfilled,
    onResponseRejected,
  );

  return { requestInterceptorId, responseInterceptorId };
};

export const removeInterceptorsToAxiosSWRInstance = ({
  requestInterceptorId,
  responseInterceptorId,
}: {
  requestInterceptorId: number;
  responseInterceptorId: number;
}) => {
  axiosSWRInstance.interceptors.request.eject(requestInterceptorId);
  axiosSWRInstance.interceptors.response.eject(responseInterceptorId);
};
