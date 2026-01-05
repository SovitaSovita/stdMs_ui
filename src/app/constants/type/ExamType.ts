export type ExamUpsertRequest = {
  id?: string;
  title: string;
  examType: "MONTHLY" | "SEMESTER";
  examDate: string;
  meKun: number;
  classId?: string;
};
export type ExamResponse = {
  id: string;
  title: string;
  examType: "MONTHLY" | "SEMESTER";
  examDate: string;
  examTime?: string;
  meKun: number;
  description?: string;
};
