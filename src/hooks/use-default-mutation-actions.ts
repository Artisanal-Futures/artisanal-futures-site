'use client'

import { useRouter } from 'next/navigation'
import { toastService } from '@dreamwalker-studios/toasts'
import { type TRPCClientErrorLike } from '@trpc/client'

import { type AppRouter } from '~/server/api/root'
import { api } from '../trpc/react'

type Entity = 'product'

type Props = {
  entity: Entity
  redirectPath?: string
}

export const useDefaultMutationActions = ({ entity, redirectPath }: Props) => {
  const apiContext = api.useUtils()
  const router = useRouter()

  const defaultSettled = () => {
    void apiContext[entity].invalidate()
    router.refresh()
  }

  const defaultError = (error: TRPCClientErrorLike<AppRouter>) =>
    toastService.error({
      message:
        error?.message ??
        `Something went wrong with the ${entity} operation. Please try again later.`,
      error,
    })
  const defaultSuccess = (props: { message: string }) => {
    toastService.success(props.message)

    // if (redirectPath) {
    //   router.replace(`/admin/${redirectPath}`);
    //   router.refresh();
    //   void apiContext[entity].invalidate();
    // } else {
    //   router.refresh();
    //   void apiContext[entity].invalidate();
    // }
  }

  const defaultEditOnSuccess = (message: string, id: string) => {
    toastService.success({ message })

    if (redirectPath) {
      router.push(`/admin/${redirectPath}/${id}/edit`)
      router.refresh()
    } else {
      router.refresh()
    }
  }

  const defaultDelayedSuccess = (message: string, id?: string) => {
    toastService.success({ message })

    const path = `/admin/${redirectPath}${id ? `/${id}/edit` : ''}`
    router.push(path)

    // Use a setTimeout to allow the navigation to complete before invalidating and refreshing
    setTimeout(() => {
      void apiContext[entity].invalidate()
      router.refresh()
    }, 100)
  }

  const defaultActions = {
    onSuccess: defaultSuccess,
    onError: defaultError,
    onSettled: defaultSettled,
  }

  const defaultDelayedActions = {
    onSuccess: ({ message }: { message: string }) =>
      defaultDelayedSuccess(message),
    onError: defaultError,
    onSettled: defaultSettled,
  }

  return {
    defaultActions,
    defaultError,
    defaultSettled,
    defaultSuccess,
    defaultEditOnSuccess,
    defaultDelayedSuccess,
    defaultDelayedActions,
    onSettled: defaultSettled,
    onError: defaultError,
    onSuccess: defaultSuccess,
  }
}
