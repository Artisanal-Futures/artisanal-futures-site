import { SonarToastProcessor } from "./processors/sonner";
import { type ToastProcessor } from "./toast-processor";

export class ToastProcessorFactory {
  static createToastProcessor(processorType: string): ToastProcessor {
    switch (processorType) {
      case "sonner":
        return new SonarToastProcessor();

      default:
        throw new Error("Unsupported toast processor type");
    }
  }
}
