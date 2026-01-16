import { Paths } from "../constants/Paths";
import {
  StudentsRequestUpsertType,
  StuInfoDetailResponseType,
} from "../constants/type";
import RestService from "./RestService";

const StudentService = {
  getInfoList: async (id: string): Promise<StuInfoDetailResponseType> => {
    return await RestService.get<StuInfoDetailResponseType>(
      Paths.student.getInfoList(id)
    );
  },
  upsertStudent: async (sentData: StudentsRequestUpsertType): Promise<any> => {
    return await RestService.post(Paths.student.upsert, sentData);
  },
  deleteList: async (ids: string[]): Promise<any> => {
    return await RestService.delete(Paths.student.deleteList, ids);
  },
  excelPreview: async (file: File): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Validate file
      if (!file || file.size === 0) {
        return {
          success: false,
          message: "File is empty or invalid",
          payload: null,
        };
      }

      // Check file type
      const validTypes = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (
        !validTypes.includes(file.type) &&
        !file.name.match(/\.(xls|xlsx)$/i)
      ) {
        return {
          success: false,
          message:
            "Invalid file type. Please upload Excel file (.xls or .xlsx)",
          payload: null,
        };
      }

      const response = await RestService.post(
        Paths.student.excelPreview,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response;
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to preview Excel file";

      console.error("excelPreview error:", error);

      return {
        success: false,
        message: errorMessage,
        payload: null,
      };
    }
  },
  excelImport: async (file: File, classroomId: string): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Validate file
      if (!file || file.size === 0) {
        return {
          success: false,
          message: "File is empty or invalid",
          payload: null,
        };
      }

      // Check file type
      const validTypes = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (
        !validTypes.includes(file.type) &&
        !file.name.match(/\.(xls|xlsx)$/i)
      ) {
        return {
          success: false,
          message:
            "Invalid file type. Please upload Excel file (.xls or .xlsx)",
          payload: null,
        };
      }

      const response = await RestService.post(
        Paths.student.excelImport(classroomId),
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response;
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to import Excel file";

      console.error("excelImport error:", error);

      return {
        success: false,
        message: errorMessage,
        payload: null,
      };
    }
  },
};

export default StudentService;
