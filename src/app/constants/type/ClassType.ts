export type ClassResponseType = {
  id: string;
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
    id: string;
    fullName: string;
    gender: "M" | "F";
    dateOfBirth: string; // ISO date string
  }[];
  subjects: {
    id: string;
    name: string;
    classId: string;
  }[];
  exams: {
    id: string;
    title: string;
    examType: "SEMESTER" | "MONTHLY"; // extend if more types exist
    examDate: string; // ISO date string
    classId: string;
  }[];
};

export type ClassInfoResponseType = {
  id: string;
  name: string;
  grade: string;
  year: string;
};
