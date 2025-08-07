export type ClassResponseType = {
  id: number;
  name: string;
  grade: string;
  year: string;
  user: {
    id: string;
    username: string;
    email: string;
    fullname: string;
    profile: string;
    role: "USER" | "ADMIN"; // adjust as needed
  };
  students: {
    id: number;
    fullName: string;
    gender: "M" | "F";
    dateOfBirth: string; // ISO date string
  }[];
  subjects: {
    id: number;
    name: string;
    classId: number;
  }[];
  exams: {
    id: number;
    title: string;
    examType: "SEMESTER" | "MONTHLY"; // extend if more types exist
    examDate: string; // ISO date string
    classId: number;
  }[];
};

export type ClassInfoResponseType = {
  id: number;
  name: string;
  grade: string;
  year: string;
};
