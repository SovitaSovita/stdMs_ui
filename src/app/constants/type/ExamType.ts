export type ExamUpsertRequest = {
  id?: string;
  title: string;
  examType: "MONTHLY" | "SEMESTER";
  examDate: string;
  classId?: string;
};
export type ExamResponse = {
  id: string;
  title: string;
  examType: "MONTHLY" | "SEMESTER";
  examDate: string;
};
