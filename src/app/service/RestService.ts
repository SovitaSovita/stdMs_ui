import { AxiosRequestConfig } from "axios";
import { axiosBackInstance } from "../utils/axios";

const RestService = {
  get: async <T>(path: string, config?: AxiosRequestConfig<T>): Promise<T> => {
    try {
      const response = await axiosBackInstance.get<T>(path, config);
      return response.data;
    } catch (e) {
      throw e;
    }
  },
  post: async <T, R>(
    path: string,
    sendData?: T,
    config?: AxiosRequestConfig<T>,
  ): Promise<R> => {
    try {
      const response = await axiosBackInstance.post<R>(path, sendData, config);
      return response.data;
    } catch (e) {
      throw e;
    }
  },
  put: async <T, R>(
    path: string,
    sendData?: T,
    config?: AxiosRequestConfig<T>,
  ): Promise<R> => {
    try {
      const response = await axiosBackInstance.put<R>(path, sendData, config);
      return response.data;
    } catch (e) {
      throw e;
    }
  },
  patch: async <T, R>(
    path: string,
    sendData?: T,
    config?: AxiosRequestConfig<T>,
  ): Promise<R> => {
    try {
      const response = await axiosBackInstance.patch<R>(path, sendData, config);
      return response.data;
    } catch (e) {
      throw e;
    }
  },
  delete: async <T, R>(
    path: string,
    sendData?: T,
    config?: AxiosRequestConfig<T>,
  ): Promise<R> => {
    try {
      const response = await axiosBackInstance.delete<R>(path, {
        ...config,
        data: sendData,
      });
      return response.data;
    } catch (e) {
      throw e;
    }
  },
};

export default RestService;