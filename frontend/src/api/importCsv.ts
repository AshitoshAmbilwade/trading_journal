// frontend/src/api/importCsv.ts
import { fetchApi } from "@/utils/apiHandler";

export const importCsvApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return await fetchApi({
      url: "/import/import-csv",
      method: "POST",
      data: formData,
    });
  },

  // New: uploadMultiple supports FileList or File[] and optional onProgress callback
  uploadMultiple: async (
    files: FileList | File[],
    onProgress?: (percent: number) => void
  ) => {
    const formData = new FormData();
    // Multer route expects field name "files" (upload.array("files"))
    Array.from(files).forEach((f) => formData.append("files", f));

    return await fetchApi({
      url: "/import/import-csv",
      method: "POST",
      data: formData,
      // axios-specific progress hook; fetchApi passes this through to axios
      onUploadProgress: (progressEvent: any) => {
        if (!onProgress) return;
        try {
          const { loaded, total } = progressEvent;
          if (total) {
            const percent = Math.round((loaded * 100) / total);
            onProgress(percent);
          }
        } catch (e) {
          // ignore progress errors
        }
      },
    });
  },
};
