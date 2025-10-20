import { ClassInfoResponseType } from "@/app/constants/type";
import { atom } from "jotai";

export const classroomAtom = atom<ClassInfoResponseType | null>(null);