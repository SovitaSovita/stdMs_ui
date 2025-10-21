import { Paths } from "../constants/Paths";
import { StudentsRequestUpsertType, StuInfoDetailResponseType } from "../constants/type";
import RestService from "./RestService";

const StudentService = {
  getInfoList: async (id: number): Promise<StuInfoDetailResponseType> => {
    return await RestService.get<StuInfoDetailResponseType>(Paths.student.getInfoList(id));
  },
  upsertStudent: async (sentData: StudentsRequestUpsertType): Promise<any> => {
    return await RestService.post(Paths.student.upsert, sentData);
  },
  deleteList: async (ids: number[]): Promise<any> => {
    return await RestService.delete(Paths.student.deleteList, ids);
  },
};

export default StudentService;