import { ClassInfoResponseType, StudentsInfo, StuInfoDetailResponseType } from "@/app/constants/type";
import { SubjectResponse } from "@/app/constants/type/SubjectType";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const classroomAtom = atomWithStorage<ClassInfoResponseType | null>("classroomData", null);

export const studentsAtom = atom<StuInfoDetailResponseType | null>(null);
export const subjectsAtom = atom<SubjectResponse[]>([]);
export const attendanceAtom = atom<StudentsInfo[]>([]);
export const classLoadingAtom = atom(false);