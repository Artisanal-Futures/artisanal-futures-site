import SiteLayout from '~/app/(site)/layout';

export default function ServiceCategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteLayout>{children}</SiteLayout>;
}
