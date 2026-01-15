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
  excelPreview: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    return await RestService.post(Paths.student.excelPreview, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  excelImport: async (file: File, classroomId: string): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    return await RestService.post(Paths.student.excelImport(classroomId), formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export default StudentService;