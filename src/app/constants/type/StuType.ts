export type StuInfoDetailResponseType = {
  student: StudentsInfo[];
  total: number;
  totalMale: number;
  totalFemale: number;
};
export type StudentsInfo = {
  id: string;
  fullName: string;
  gender: "M" | "F";
  dateOfBirth: string;
  fatherName: string;
  fatherOccupation: string;
  montherName: string;
  montherOccupation: string;
  placeOfBirth: string;
  address: string;
};

export type StudentsRequestUpsertType = {
  id?: string;
  classId?: string;
  fullName: string;
  gender: "M" | "F";
  dateOfBirth: string;
  fatherName: string;
  fatherOccupation: string;
  montherName: string;
  montherOccupation: string;
  placeOfBirth: string;
  address: string;
};

export type StudentCountType = {
  total: number;
  totalMale: number;
  totalFemale: number;
};
