"use client";

import type { Resolver } from "react-hook-form";
import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Loader2, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { HCaptchaHandle } from "~/components/inputs/hcaptcha-form-field";
import type {
  ContactFormData,
  ContactFormValues,
} from "~/lib/validators/contact";
import { contactFormSchema } from "~/lib/validators/contact";
import { api } from "~/trpc/react";
import { useDirtyForm } from "~/hooks/use-dirty-form";
import { useKeyboardEnter } from "~/hooks/use-keyboard-enter";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { HCaptchaField } from "~/components/inputs/hcaptcha-form-field";
import { InputFormField } from "~/components/inputs/input-form-field";
import { TextareaFormField } from "~/components/inputs/textarea-form-field";

type FormValues = {
  name: string;
  email: string;
  phone?: string;
  message: string;
  preferredContactMethod: "email" | "phone" | "no-preference";
  website?: string;
};

const DEFAULT_MESSAGE_MAX_LENGTH = 180;
export function DefaultContactForm() {
  const messageMaxLength = DEFAULT_MESSAGE_MAX_LENGTH;

  const schema = contactFormSchema(messageMaxLength);

  const captchaRef = useRef<HCaptchaHandle>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
      preferredContactMethod: "no-preference",
    },
  });

  const { mutate, isPending } = api.contact.send.useMutation({
    onSuccess: ({ message }) => {
      toast.dismiss();
      toast.success(message);
      setCaptchaToken("");
      const handle = captchaRef.current;
      if (handle) handle.reset();
      form.reset();
    },
    onError: (err: { message?: string }) => {
      toast.dismiss();
      toast.error(err.message ?? "Something went wrong. Please try again.");
      const handle = captchaRef.current;
      if (handle) handle.reset();
      setCaptchaToken("");
    },
    onMutate: () => toast.loading("Sending message..."),
  });

  const messageLength =
    (form.watch("message") as string | undefined)?.length ?? 0;

  const onSubmit = async (data: FormValues) => {
    if (!captchaToken) {
      toast.error("Please complete the captcha");
      return;
    }
    setError(null);
    const payload: ContactFormData = {
      name: data.name,
      email: data.email,
      message: data.message,
      phone: data.phone,
      preferredContactMethod: data.preferredContactMethod,
      captchaToken,
    };
    mutate(payload);
  };

  const resetSuccess = () => {
    setIsSuccess(false);
  };

  const isDirty = form.formState.isDirty;

  useKeyboardEnter(form, onSubmit);
  useDirtyForm(isDirty);

  if (isSuccess) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Message sent successfully!</strong>
          <br />
          We&apos;ve received your message and will get back to you soon.
        </AlertDescription>
        <Button variant="outline" onClick={resetSuccess} className="mt-4">
          Send Another Message
        </Button>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <InputFormField
          form={form}
          name="name"
          label="First Name *"
          inputClassName={"mt-2"}
          placeholder="Jane"
          required
        />

        <InputFormField
          form={form}
          name="email"
          label="Email *"
          inputClassName={"mt-2"}
          type="email"
          placeholder="jane@example.com"
          required
        />

        <InputFormField
          form={form}
          name="phone"
          label="Phone Number (Optional)"
          inputClassName={"mt-2"}
          type="tel"
          placeholder="+1 300 555 0000"
        />

        <InputFormField
          form={form}
          name="website"
          label="Website (optional)"
          placeholder="Enter your website"
          className="hidden"
        />

        <TextareaFormField
          form={form}
          name="message"
          label="Message *"
          messageLength={messageLength}
          textareaClassName={"mt-2"}
          maxLength={messageMaxLength}
          placeholder="Tell us how we can help..."
          required
        />

        {/* hCaptcha */}
        <HCaptchaField
          ref={captchaRef}
          onVerify={setCaptchaToken}
          onExpire={() => setCaptchaToken("")}
          onError={() => setCaptchaToken("")}
          label="Verification"
          required
        />

        <Button
          type="submit"
          disabled={isPending || !captchaToken}
          size="lg"
          className="w-full"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-5 w-5" />
              Send Message
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
