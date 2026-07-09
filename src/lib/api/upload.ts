import { useMutation } from "@tanstack/react-query";
import http from ".";

export type UploadFolder =
  | "news"
  | "executives"
  | "events"
  | "chapters"
  | "gallery"
  | "general";

export interface UploadResult {
  url: string;
  publicId: string;
  resourceType: string;
  format?: string;
  bytes?: number;
}

export const useUploadMedia = () =>
  useMutation({
    mutationFn: async ({
      file,
      folder = "general",
    }: {
      file: File;
      folder?: UploadFolder;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await http.post("/upload/", formData);
      return res.data as UploadResult;
    },
  });
