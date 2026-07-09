import { toast } from "sonner";

export const errorToast = (message: string, title = "Error") => {
  toast.error(title, { description: message });
};

export const warningToast = (message: string, title = "Warning") => {
  toast.warning(title, { description: message });
};

export const successToast = (message: string, title = "Success") => {
  toast.success(title, { description: message });
};
