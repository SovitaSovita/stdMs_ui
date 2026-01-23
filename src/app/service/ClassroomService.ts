import { Paths } from "../constants/Paths";
import {
  ClassAvgExamFilterResponseType,
  ClassExamDataResponseType,
  ClassInfoResponseType,
  ClassReqFilterDetailType,
  ClassResponseType,
  ClassUpsertRequest,
  ScoreUpsertRequest,
} from "../constants/type";
import RestService from "./RestService";

const ClassroomService = {
  upsert: async (sentData: ClassUpsertRequest): Promise<any> => {
    return await RestService.post(Paths.class.upsert, sentData);
  },
  getDetailList: async (): Promise<ClassResponseType[]> => {
    return await RestService.get<ClassResponseType[]>(Paths.class.getClassList);
  },
  getInfoList: async (): Promise<ClassInfoResponseType[]> => {
    return await RestService.get<ClassInfoResponseType[]>(
      Paths.class.getInfoClass,
    );
  },
  getById: async (id: string): Promise<ClassInfoResponseType> => {
    try {
      return await RestService.get<ClassInfoResponseType>(
        Paths.class.getInfoClassById,
        {
          params: { classroomId: id },
        },
      );
    } catch (error) {
      console.error("Error fetching classroom by ID:", error);
      return {} as ClassInfoResponseType;
    }
  },
  upsertStuScores: async (
    classId: string,
    examId: string,
    sentData: ScoreUpsertRequest[],
  ): Promise<any> => {
    return await RestService.post(
      Paths.class.upsertScore(classId, examId),
      sentData,
    );
  },
  getDetail: async (
    id: string,
    sendData: ClassReqFilterDetailType,
  ): Promise<ClassExamDataResponseType> => {
    return await RestService.post<
      ClassReqFilterDetailType,
      ClassExamDataResponseType
    >(Paths.class.getDetail(id), sendData);
  },
  getSemesterAvgs: async (
    id: string,
    examDate: string,
  ): Promise<ClassAvgExamFilterResponseType> => {
    return await RestService.post<string, ClassAvgExamFilterResponseType>(
      Paths.class.getSemesterAvgs(id, examDate),
    );
  },
};

export default ClassroomService;
