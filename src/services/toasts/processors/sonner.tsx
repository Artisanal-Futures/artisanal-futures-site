import { toast } from "sonner";

import type {
  ToastCustom,
  ToastError,
  ToastFeedback,
  ToastInform,
  ToastSuccess,
} from "../types";
import { type ToastProcessor } from "../toast-processor";

export class SonarToastProcessor implements ToastProcessor {
  success(props: ToastSuccess) {
    return toast.success(props.message, {
      position: "top-center",
      ...props?.options,
    });
  }

  error(props: ToastError) {
    if (props.error) console.error("Toast Service Error:", props.error);
    return toast.error(props.message, props?.options ?? {});
  }

  inform(props: ToastInform) {
    return toast(props.message, props?.options ?? {});
  }

  feedback(props: ToastFeedback) {
    return toast(
      <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
        <code className="text-white">
          {JSON.stringify(props.object, null, 2)}
        </code>
      </pre>,
      props?.options ?? {},
    );
  }

  custom(props: ToastCustom) {
    return toast(props.Component, {
      position: "top-center",
      ...props?.options,
    });
  }
}
