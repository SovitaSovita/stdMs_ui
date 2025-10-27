import { Paths } from "../constants/Paths";
import { ClassInfoResponseType, ClassResponseType } from "../constants/type";
import RestService from "./RestService";

const ClassroomService = {
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
};

export default ClassroomService;
