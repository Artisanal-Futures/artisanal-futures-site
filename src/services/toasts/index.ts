import { ToastProcessorFactory } from "./factory";

export * from "./types";

export const toastService =
  ToastProcessorFactory.createToastProcessor("sonner");
