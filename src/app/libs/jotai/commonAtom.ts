import { ModeType } from "@/app/constants/type";
import { atom } from "jotai";

export const ScreenExamAtom = atom<ModeType>('default');
