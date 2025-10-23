import useSWR from "swr";
import { fetcher } from "./fetcher";
import { useEffect } from "react";
import { ClassInfoResponseType } from "@/app/constants/type";
import { useSetAtom } from "jotai";
import { classroomAtom } from "../jotai/classroomAtom";
import { Paths } from "@/app/constants/Paths";

// export const useClassroomSWR = (id?: string) => {
//   // Only run SWR if `id` exists (avoids unnecessary requests)
//   const shouldFetch = id ? Paths.class.getInfoClassById(id) : null;
//   const { data, error, isLoading, mutate } = useSWR<ClassInfoResponseType>(shouldFetch, fetcher);
//   const setClassroomState = useSetAtom(classroomAtom);
  
//   // ✅ only update global state when SWR data changes
//   useEffect(() => {
//     if (data) setClassroomState(data);
//   }, [data, setClassroomState]);

//   return { data, error, isLoading, mutate };
// };
