import { useMutation } from "@tanstack/react-query";
import axios, { AxiosProgressEvent } from "axios";
import { useState } from "react";

type UploadResponse = {
  success: boolean;
  url: string;
  publicId: string;
  fileSize: number;
  fileName: string;
};

type UploadError = {
  error: string;
};

type UploadParams = {
  file: File;
  escrowId: string;
  milestoneId: string;
};

export function useFileUpload() {
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const mutation = useMutation<UploadResponse, Error, UploadParams>({
    mutationFn: async ({ file, escrowId, milestoneId }: UploadParams) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("escrowId", escrowId);
      formData.append("milestoneId", milestoneId);

      const response = await axios.post<UploadResponse | UploadError>(
        "/api/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              setUploadProgress(progress);
            }
          },
        },
      );

      // Check if the response contains an error
      if ("error" in response.data) {
        throw new Error(response.data.error);
      }

      return response.data as UploadResponse;
    },
    onSettled: () => {
      // Reset progress after completion or error
      setTimeout(() => setUploadProgress(0), 1000);
    },
  });

  return {
    upload: mutation.mutateAsync,
    isUploading: mutation.isPending,
    uploadProgress,
    error: mutation.error,
    reset: mutation.reset,
    data: mutation.data,
  };
}
