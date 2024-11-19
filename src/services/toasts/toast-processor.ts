import type {
  ToastCustom,
  ToastError,
  ToastFeedback,
  ToastInform,
  ToastSuccess,
} from "./types";

export interface ToastProcessor {
  success(props: ToastSuccess): void;
  error(props: ToastError): void;
  inform(props: ToastInform): void;
  feedback(props: ToastFeedback): void;
  custom(props: ToastCustom): void;
}
