


type Props = {
  children: React.ReactNode
}


export default function SankofaSizerLayout({ children }: Props) {
  return (
    <main className="flex  h-screen flex-col  ">
    <div className=" flex max-h-[calc(100vh-64px)] flex-grow  flex-col-reverse items-stretch bg-slaQte-50 p-8 md:flex-row">
        {children}
      </div>
    </main>
  )
}
