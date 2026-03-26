export type BookRecordRequest = {
  classId: string;
  stuId: string;
} 

export type BookRecordResponse = {
  student: StudentResponse;
  subjects: BookRecordScoreResponse[];

  totalScoreS1: number;
  totalScoreS2: number;

  totalAverageS1: number;
  totalAverageS2: number;

  totalRankS1: number;
  totalRankS2: number;

  totalAverageMonthS1: number;
  totalAverageMonthS2: number;

  totalRankMonthS1: number;
  totalRankMonthS2: number;

  totalAverageFullS1: number;
  totalAverageFullS2: number;

  totalRankFullS1: number;
  totalRankFullS2: number;

  totalAverageAnnual: number;
  totalRankAnnual: number;
};

export type BookRecordScoreResponse = {
  id: string;
  name: string;
  nameKh: string;
  nameEn: string;

  maxScore: number;

  scoreS1: number;
  rankS1: number;

  scoreS2: number;
  rankS2: number;

  scoreAnnual: number;
  rankAnnual: number;
  grade: string;
};

export type StudentResponse = {
  id: string;
  fullName: string;
  idCard?: string;
  gender?: string;
  dateOfBirth?: string; // ISO string
};