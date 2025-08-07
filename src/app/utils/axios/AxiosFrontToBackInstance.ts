import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";

// Front to Back axios instance
export const axiosFrontToBackInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_FRONT_TO_BACK_URL,
});

axiosRetry(axiosFrontToBackInstance, {
  retries: 3,
  retryDelay: () => 1000,
  retryCondition: (error) => {
    // 네트워크 오류나 5xx 서버 오류에 대해 재시도
    return axiosRetry.isNetworkError(error);
  },
});
