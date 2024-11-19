import { type CreateEmailOptions } from 'resend'

import type { EmailProcessor } from '../email-processor'
import type { Email } from '../types'
import { resend } from '../clients/resend'

export class ResendEmailProcessor implements EmailProcessor {
  async sendEmail<EmailData>(props: Email<EmailData>): Promise<unknown> {
    try {
      const res = await resend.emails.send({
        from: props.from,
        to: props.to,
        subject: props.subject,
        react: props.template(props.data),
      } as CreateEmailOptions)

      return {
        status: res?.error ? 'error' : 'success',
        message: res?.error ? res?.error?.message : 'Email sent successfully',
      }
    } catch (e) {
      console.error('sendEmail error: ', e)
    }
  }
}
