export const metadata = {
  title: 'Legal',
  description: 'The legal information for Artisanal Futures',
}

export default function LegalPage() {
  return (
    <>
      <h1 className="scroll-m-20  pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        Legal
      </h1>

      <p className="lead mb-3 mt-2  text-slate-400">
        Policies for our community and other legal stuff
      </p>
      <ul className="my-5 list-inside list-disc space-y-4 text-blue-500">
        <li className="transition-all hover:text-blue-600 hover:underline ">
          <a href={`/legal/terms-of-use`}>Terms of Use</a>
        </li>
        <li className="transition-all hover:text-blue-600 hover:underline ">
          <a href={`/legal/privacy`}>Privacy</a>
        </li>{' '}
        <li className="transition-all hover:text-blue-600 hover:underline ">
          <a href={`/legal/collective-agreement`}>
            Artisanal Futures Collective Agreement
          </a>
        </li>{' '}
        <li className="transition-all hover:text-blue-600 hover:underline ">
          <a href={`/legal/help-center`}>Help Center</a>
        </li>
        <li className="transition-all hover:text-blue-600 hover:underline ">
          <a href={`/legal/cookies`}>Cookie Policy</a>
        </li>
      </ul>
    </>
  )
}
