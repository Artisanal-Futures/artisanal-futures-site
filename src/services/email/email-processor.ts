import type { Email } from "./types";

export interface EmailProcessor {
  sendEmail<EmailData>(props: Email<EmailData>): Promise<unknown>;
}
