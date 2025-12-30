import { Paths } from "../constants/Paths";
import {
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
      Paths.class.getInfoClass
    );
  },
  getById: async (id: string): Promise<ClassInfoResponseType> => {
    return await RestService.get<ClassInfoResponseType>(
      Paths.class.getInfoClassById,
      {
        params: { classroomId: id },
      }
    );
  },
  upsertStuScores: async (
    classId: string,
    examId: string,
    sentData: ScoreUpsertRequest[]
  ): Promise<any> => {
    return await RestService.post(
      Paths.class.upsertScore(classId, examId),
      sentData
    );
  },
  getDetail: async (
    id: string,
    sendData: ClassReqFilterDetailType
  ): Promise<ClassExamDataResponseType> => {
    return await RestService.post<
      ClassReqFilterDetailType,
      ClassExamDataResponseType
    >(Paths.class.getDetail(id), sendData);
  },
};

export default ClassroomService;
