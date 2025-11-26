// frontend/src/api/importCsv.ts
import { fetchApi } from "@/utils/apiHandler";

export const importCsvApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return await fetchApi({
      url: "import/import-csv",
      method: "POST",
      data: formData,
    });
  },

  // Upload multiple CSV files
  uploadMultiple: async (
    files: FileList | File[],
    onProgress?: (percent: number) => void
  ) => {
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));

    return await fetchApi({
      url: "import/import-csv",
      method: "POST",
      data: formData,

      // No ANY — use browser's native ProgressEvent
      onUploadProgress: (e: ProgressEvent) => {
        if (!onProgress) return;
        try {
          const loaded = (e.loaded ?? 0);
          const total = (e.total ?? 0);
          if (total > 0) {
            const percent = Math.round((loaded * 100) / total);
            onProgress(percent);
          }
        } catch {
          // ignore progress errors
        }
      },
    });
  },
};
