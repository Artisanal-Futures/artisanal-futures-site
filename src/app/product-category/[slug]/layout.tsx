import SiteLayout from '~/app/(site)/layout'; 

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteLayout>{children}</SiteLayout>;
}