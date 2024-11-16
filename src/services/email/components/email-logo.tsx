import * as React from 'react'
import { Img } from '@react-email/components'

import { emailConfig } from '../config'

export const EmailLogo = () => (
  <Img src={emailConfig.logo} width="64" height="64" alt="Logo" />
)
