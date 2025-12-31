import { ClassInfoResponseType, StudentsInfo, StuInfoDetailResponseType } from "@/app/constants/type";
import { SubjectResponse } from "@/app/constants/type/SubjectType";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const classroomAtom = atomWithStorage<ClassInfoResponseType | null>("classroomData", null);

//In generaly Mekun is number of subject or total credit of each subject
export const mekunAtom = atomWithStorage<number | null>("mekun", 16.5);

//In generaly Mekun of average semester is number of months exam (1 semester = 3 months)
export const mekunSemesterAtom = atomWithStorage<number | null>("mekunSemester", 3);

export const studentsAtom = atom<StuInfoDetailResponseType | null>(null);
export const subjectsAtom = atom<SubjectResponse[]>([]);
export const attendanceAtom = atom<StudentsInfo[]>([]);
export const classLoadingAtom = atom(false);