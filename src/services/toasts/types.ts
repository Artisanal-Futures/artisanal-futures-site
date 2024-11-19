import type Error from 'next/error'
import { type TRPCClientErrorLike } from '@trpc/client'

import { type AppRouter } from '~/server/api/root'

export type ToastAdditional = {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  dismissible?: boolean
}

export type ToastSuccess = {
  message: string
  options?: ToastAdditional
}

export type ToastInform = {
  message: string
  options?: ToastAdditional
}

export type ToastError = {
  message: string
  error?: TRPCClientErrorLike<AppRouter> | Error
  options?: ToastAdditional
}

export type ToastFeedback = {
  object: Record<string, unknown>
  options?: ToastAdditional
}

export type ToastCustom = {
  Component: JSX.Element
  options?: ToastAdditional
}
