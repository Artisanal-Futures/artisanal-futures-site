import * as React from 'react'
import { Link, Text } from '@react-email/components'
import { SingleColumn } from 'responsive-react-email'

import { EmailBody } from '../components/email-body'
import { EmailCallToActionButton } from '../components/email-call-to-action-button'
import { EmailImportantText } from '../components/email-important-text'
import { EmailLogo } from '../components/email-logo'
import { EmailSignature } from '../components/email-signature'

type Props = {
  name: string
  webinarLink: string
  isPreview?: boolean
}

export const WelcomeGuestEmail = (props: Props) => {
  return (
    <EmailBody
      previewText="Welcome to Artisanal Futures!"
      isPreview={props.isPreview}
    >
      <SingleColumn pX={25}>
        <EmailLogo />
        <Text>Welcome to Artisanal Futures, Ubuntu-AI Artisans!</Text>

        <Text>Hello {props.name},</Text>

        <Text>
          Welcome! As you can see we are working with &quot;Artisanal
          Futures&quot; in Detroit. The Artisanal Futures Upcycling AI tool will
          be available to you for FREE. Attend our webinar to learn more. Please
          join us!
        </Text>

        <EmailImportantText>
          The webinar will be held on Thursday, November 21st at 5:30 PM WAT.
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
          If you have any questions, please don&apos;t hesitate to reach out to
          the coordinator of this event, Zita.
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
