export type StuInfoDetailResponseType = {
  student: StudentsInfo[];
  total: number;
  totalMale: number;
  totalFemale: number;
};
export type StudentsInfo = {
  id: number;
  fullName: string;
  gender: 'M' | 'F';
  dateOfBirth: string;
  fatherName: string;
  fatherOccupation: string;
  montherName: string;
  montherOccupation: string;
  placeOfBirth: string;
  address: string;
};

export type StudentsRequestUpsertType = {
  id?: number,
  classId?: number,
  fullName: string;
  gender: 'M' | 'F';
  dateOfBirth: string;
  fatherName: string;
  fatherOccupation: string;
  montherName: string;
  montherOccupation: string;
  placeOfBirth: string;
  address: string;
};