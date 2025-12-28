import { Paths } from "../constants/Paths";
import { SubjectResponse, SubjectUpsertRequest } from "../constants/type/SubjectType";
import RestService from "./RestService";

const SubjectService = {
  getByClassId: async (id: string): Promise<SubjectResponse[]> => {
    return await RestService.get<SubjectResponse[]>(
      Paths.subject.getById,
      {
        params: { classId: id },
      }
    );
  },
  upsert: async (sentData: SubjectUpsertRequest): Promise<any> => {
    return await RestService.post(Paths.subject.upsert, sentData);
  },
  delete: async (id: string): Promise<any> => {
    return await RestService.delete(Paths.subject.delete(id));
  },
};

export default SubjectService;