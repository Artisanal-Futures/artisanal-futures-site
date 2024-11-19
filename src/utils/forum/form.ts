import * as React from 'react'
import { useBeforeunload } from 'react-beforeunload'
import { type FieldValues, type FormState } from 'react-hook-form'

type Props<T extends FieldValues> = {
  formState: FormState<T>
  message?: string
}

const defaultMessage = 'Are you sure to leave without saving?'

export function useLeaveConfirm<T extends FieldValues>({
  formState,
  message = defaultMessage,
}: Props<T>) {
  const { isDirty } = formState

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = message
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isDirty, message])

  useBeforeunload((event) => {
    if (isDirty) {
      event.preventDefault()
    }
  })

  return
}
