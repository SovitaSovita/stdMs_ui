import { axiosBackInstance } from "@/app/utils/axios";

const baseURL = process.env.NEXT_PUBLIC_BACK_END_URL;

export const fetcher = async <T>(url: string): Promise<T> => {
  const response = await axiosBackInstance.get<T>(baseURL + url);
  return response.data;
};

// If you want to use POST with SWR mutation
export const poster = async <T>(url: string, data?: any): Promise<T> => {
  const response = await axiosBackInstance.post<T>(baseURL + url, data);
  return response.data;
};
