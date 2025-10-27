import { Paths } from "../constants/Paths";
import { StudentsRequestUpsertType, StuInfoDetailResponseType } from "../constants/type";
import RestService from "./RestService";

const StudentService = {
  getInfoList: async (id: string): Promise<StuInfoDetailResponseType> => {
    return await RestService.get<StuInfoDetailResponseType>(Paths.student.getInfoList(id));
  },
  upsertStudent: async (sentData: StudentsRequestUpsertType): Promise<any> => {
    return await RestService.post(Paths.student.upsert, sentData);
  },
  deleteList: async (ids: string[]): Promise<any> => {
    return await RestService.delete(Paths.student.deleteList, ids);
  },
};

export default StudentService;