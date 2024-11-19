import { RelativePageLoader } from '~/app/_components/relative-page-loader'
import { Navbar } from '../admin-panel/navbar'
import { DataFetchErrorMessage } from './data-fetch-error-message'

type Props = {
  children: React.ReactNode
  isDataLoading?: boolean
  isDataError?: boolean
  title?: string
  breadcrumbs?: {
    title: string
    href?: string
    isActive?: boolean
  }[]
}
export const AdminDataLayout = ({
  children,
  title,
  isDataLoading,
  isDataError,
  breadcrumbs,
}: Props) => {
  return (
    <div>
      <Navbar title={title} breadcrumbs={breadcrumbs} />
      <div className={'container px-0 pb-8 pt-0 sm:px-0'}>
        <>
          {isDataLoading && <RelativePageLoader />}
          {!isDataLoading && !isDataError && <>{children}</>}
          {!isDataLoading && isDataError && (
            <DataFetchErrorMessage message="There seems to be an issue with loading the data." />
          )}
        </>
      </div>
    </div>
  )
}
