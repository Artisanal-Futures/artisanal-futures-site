import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { ContentLayout } from "./content-layout";

type Props = {
  children: React.ReactNode;
  currentPage: string;
  title: string;
  breadcrumbs?: Array<{
    label: string;
    href: string;
  }>;
};

export function AdminClientLayout({
  children,
  currentPage,
  title,
  breadcrumbs = [],
}: Props) {
  return (
    <ContentLayout title={title}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/admin/dashboard`}>Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((crumb, index) => (
            <>
              <BreadcrumbSeparator key={`sep-${index}`} />
              <BreadcrumbItem key={crumb.href}>
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          ))}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{currentPage}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {children}
    </ContentLayout>
  );
}
