import { TrashIcon } from 'lucide-react'

import { useDefaultMutationActions } from '~/hooks/use-default-mutation-actions'
import { api } from '~/trpc/react'
import { SingleActionDialog } from '../../_components/single-action-dialog'

type Props = { productId: string }

export function DeleteProductDialog(props: Props) {
  const { defaultActions } = useDefaultMutationActions({
    entity: 'product',
  })
  const deleteProduct = api.product.delete.useMutation(defaultActions)

  const onSubmit = () => deleteProduct.mutate(props.productId)

  return (
    <SingleActionDialog
      onSubmit={onSubmit}
      color="red"
      actionText="Delete"
      description={`This action cannot be undone. This will permanently delete this
            product and remove the
            data from our servers.`}
      title="Delete product?"
      icon={TrashIcon}
      isLoading={deleteProduct.isPending}
    />
  )
}
