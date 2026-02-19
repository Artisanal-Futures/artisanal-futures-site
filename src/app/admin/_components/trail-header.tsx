import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { SheetMenu } from "~/components/admin/sheet-menu";
import { ModeToggle } from "~/components/common/mode-toggle";
import { UserNav } from "~/components/layout/user-nav";

type Props = {
  breadcrumbs: {
    label: string;
    href?: string;
  }[];
};

export const TrailHeader = ({ breadcrumbs }: Props) => {
  return (
    <header className="sticky top-0 z-10 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-secondary">
      <div className="mx-4 flex h-14 items-center sm:mx-8">
        <div className="flex items-center space-x-4 lg:space-x-0">
          <SheetMenu />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/dashboard">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {breadcrumbs.map((breadcrumb) =>
                breadcrumb.href ? (
                  <Fragment key={breadcrumb.label}>
                    <BreadcrumbItem key={breadcrumb.label}>
                      <BreadcrumbLink href={breadcrumb.href}>
                        {breadcrumb.label}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </Fragment>
                ) : (
                  <BreadcrumbItem key={breadcrumb.label}>
                    <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                  </BreadcrumbItem>
                ),
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
};
