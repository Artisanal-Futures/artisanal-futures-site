import type { ElementRef, FC, HTMLAttributes } from "react";
import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type BreadcrumbItem = {
  link?: string;
  name: string;
  isCurrent?: boolean;
};

type Props = {
  title: string;
  breadcrumbs: BreadcrumbItem[];
} & HTMLAttributes<ElementRef<"div">>;

export const FormActionHeader: FC<Props> = ({
  title,
  children,
  breadcrumbs,
}) => {
  const path = usePathname();

  const previousPath = path.split("/").slice(0, -1).join("/");

  return (
    <header className="sticky top-0 z-[10] bg-background shadow">
      {" "}
      <div
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between px-8 py-4",
        )}
      >
        <div>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/dashboard">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {breadcrumbs?.map((item, idx) => (
                <Fragment key={idx}>
                  <BreadcrumbItem>
                    {item.isCurrent ? (
                      <BreadcrumbPage>{item.name}</BreadcrumbPage>
                    ) : (
                      <>
                        <BreadcrumbLink href={item.link}>
                          {item.name}
                        </BreadcrumbLink>
                      </>
                    )}
                  </BreadcrumbItem>
                  {!item.isCurrent && <BreadcrumbSeparator />}
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          <div>
            <div className="flex items-center gap-2 pt-4">
              <Link
                href={previousPath}
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon" }),
                  "h-7 w-7",
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>

              <h2 className="text-2xl font-bold capitalize tracking-tight">
                {title}
              </h2>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </header>
  );
};
