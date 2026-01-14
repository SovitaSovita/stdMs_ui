export type ExamUpsertRequest = {
  id?: string;
  title: string;
  examType: "MONTHLY" | "SEMESTER";
  examDate: string;
  meKun: number;
  classId?: string;
  time?: string;
  description?: string;
};
export type ExamResponse = {
  id: string;
  title: string;
  examType: "MONTHLY" | "SEMESTER";
  examDate: string;
  time?: string;
  meKun: number;
  description?: string;
};
