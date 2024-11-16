import * as React from 'react'
import { Link, Text } from '@react-email/components'
import { SingleColumn } from 'responsive-react-email'

import { EmailBody } from '../components/email-body'
import { EmailCallToActionButton } from '../components/email-call-to-action-button'
import { EmailImportantText } from '../components/email-important-text'
import { EmailLogo } from '../components/email-logo'
import { EmailSignature } from '../components/email-signature'
import { emailConfig } from '../config'

type Props = {
  name: string
  webinarLink: string
  isPreview?: boolean
}

export const WelcomeGuestEmail = (props: Props) => {
  const strippedSupportEmail = emailConfig.stripEmail(emailConfig.supportEmail)

  return (
    <EmailBody
      previewText={`Welcome to Artisanal Futures!`}
      isPreview={props.isPreview}
    >
      <SingleColumn pX={25}>
        <EmailLogo />
        <Text>Welcome to Artisanal Futures</Text>

        <Text>Hello {props.name},</Text>

        <Text>
          We're thrilled to welcome you to Artisanal Futures! We're excited to
          have you join our community of artisans and creators.
        </Text>

        <Text>
          To help you get started, we'd like to invite you to our upcoming
          webinar where you'll learn more about our latest AI Agent tool.
        </Text>

        <EmailImportantText>
          The webinar will be held on Thursday, November 21st at 11:30 AM EST.
        </EmailImportantText>
      </SingleColumn>

      <SingleColumn pX={25}>
        <EmailCallToActionButton
          link={props.webinarLink}
          label="Link to Zoom Webinar"
        />
      </SingleColumn>

      <SingleColumn pX={25}>
        <Text>
          If you have any questions, please don't hesitate to reach out to the
          coordinator of this event, Zita.
          <Link href={`mailto:${`zitaechere@gmail.com`}`}>
            {`zitaechere@gmail.com`}
          </Link>
          .
        </Text>

        <Text>We look forward to seeing you on the 21st!</Text>
      </SingleColumn>
      <EmailSignature />
    </EmailBody>
  )
}
