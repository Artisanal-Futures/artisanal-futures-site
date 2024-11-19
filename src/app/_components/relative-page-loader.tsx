import { PageLoader } from './page-loader'

export const RelativePageLoader = () => {
  return (
    <div className="relative mx-auto my-auto flex h-[100svh] w-full items-center justify-center">
      <PageLoader />
    </div>
  )
}
