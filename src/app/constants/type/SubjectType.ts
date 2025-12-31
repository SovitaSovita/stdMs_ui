import { number, string } from "yup";

export type SubjectUpsertRequest = {
  id?: string;
  name: string;
  classId?: string;
  teacherName: string;
  maxScore: number;
  credit: string;
  description: string;
};
export type SubjectResponse = {
  id: string;
  name: string;
  teacherName: string;
  maxScore: number;
  credit: string;
  description: string;
};
