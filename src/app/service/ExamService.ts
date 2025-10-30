import { Paths } from "../constants/Paths";
import { ExamResponse, ExamUpsertRequest, StudentsRequestUpsertType, StuInfoDetailResponseType } from "../constants/type";
import RestService from "./RestService";

const ExamService = {
  getByClassId: async (id: string): Promise<ExamResponse[]> => {
    return await RestService.get<ExamResponse[]>(
      Paths.exam.getById,
      {
        params: { classId: id },
      }
    );
  },
  upsert: async (sentData: ExamUpsertRequest): Promise<any> => {
    return await RestService.post(Paths.exam.upsert, sentData);
  },
  delete: async (id: string): Promise<any> => {
    return await RestService.delete(Paths.exam.delete(id));
  },
};

export default ExamService;