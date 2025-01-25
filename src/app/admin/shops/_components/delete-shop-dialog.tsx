import { TrashIcon } from 'lucide-react'

import { useDefaultMutationActions } from '~/hooks/use-default-mutation-actions'
import { api } from '~/trpc/react'
import { SingleActionDialog } from '../../_components/single-action-dialog'

type Props = { shopId: string }

export function DeleteShopDialog({ shopId }: Props) {
  const { defaultSuccess, defaultError, defaultSettled } =
    useDefaultMutationActions({
      entity: 'shop',
    })

  const deleteShop = api.shop.delete.useMutation({
    onSuccess: ({ message }) => defaultSuccess({ message }),
    onError: defaultError,
    onSettled: defaultSettled,
  })

  const onSubmit = () => deleteShop.mutate({ shopId })

  return (
    <SingleActionDialog
      onSubmit={onSubmit}
      color="red"
      actionText="Delete"
      description={`Deleting a shop will remove it from the database permanently.
        Are you sure you want to delete this shop?`}
      title="Delete shop?"
      icon={TrashIcon}
      isLoading={deleteShop.isPending}
    />
  )
}
