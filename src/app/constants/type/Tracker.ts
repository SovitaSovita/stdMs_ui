export type StudyBookTrackerRequest = {
  classId: string;
  stuId: string;
  examId: string;
} 

export type StudyBookTrackerResponse = {
  student: Student;
  exam: Exam;
  subjects: SubjectScore[];

  totalScore: number;
  totalAverage: number;
  grade: string;
};

export type Student = {
  id: string;
  orderNo: number;
  fullName: string;
  idCard: string;

  gender: "M" | "F";

  dateOfBirth: string | null;

  fatherName: string | null;
  fatherOccupation: string | null;

  montherName: string | null;
  montherOccupation: string | null;

  placeOfBirth: string | null;
  address: string | null;
};

export type Exam = {
  id: string;
  title: string;

  examType: "SEMESTER" | "MONTHLY";

  examDate: string; // ISO date
  semesterNumber: number;

  meKun: number;
  meKunSemester: number;

  description: string;
  time: string | null;
};

export type SubjectScore = {
  id: string;

  name: string | null;
  nameKh: string | null;
  nameEn: string | null;

  teacherName: string | null;

  maxScore: number | null;
  credit: number | null;

  description: string | null;

  score: number;
};