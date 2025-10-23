import { ClassInfoResponseType } from "@/app/constants/type";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const classroomAtom = atomWithStorage<ClassInfoResponseType | null>("classroomData", null);