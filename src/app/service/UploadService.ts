import { Paths } from "../constants/Paths";
import RestService from "./RestService";

export type UploadedFile = {
  id: string;
  originalFileName: string;
  fileName: string;
  fileSize: number;
  uploadDate: string;
  url: string;
};

export type UploadFileResponse = {
  message?: string;
  status?: number;
  date?: string;
  payload?: UploadedFile;
};

const UploadService = {
  /**
   * Uploads a file via POST /api/v1/upload-file (multipart/form-data, field
   * name `imageFile`). Returns the API envelope with payload.url set to the
   * public URL of the uploaded image.
   */
  uploadImage: async (
    file: File,
    options?: { signal?: AbortSignal; onProgress?: (pct: number) => void }
  ): Promise<UploadFileResponse> => {
    const form = new FormData();
    form.append("imageFile", file);
    return await RestService.post<FormData, UploadFileResponse>(
      Paths.upload.file,
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
        signal: options?.signal,
        onUploadProgress: (e) => {
          if (!options?.onProgress || !e.total) return;
          options.onProgress(Math.round((e.loaded / e.total) * 100));
        },
      }
    );
  },
};

export default UploadService;
