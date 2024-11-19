export const DataFetchErrorMessage = ({ message }: { message: string }) => {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-center text-xl font-medium text-muted-foreground">
        {message} Please refresh and try again.
      </p>
    </div>
  )
}
