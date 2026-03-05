"use client";

import { cn } from "~/lib/utils";
import { useSidebarToggle } from "~/hooks/use-sidebar-toggle";
import { useStore } from "~/hooks/use-store";
import { AdminFooter } from "~/components/admin/admin-footer";
import { Sidebar } from "~/components/admin/sidebar";

type Props = {
  children: React.ReactNode;
};
export default function SidebarWrapper({ children }: Props) {
  const sidebar = useStore(useSidebarToggle, (state) => state);

  if (!sidebar) return null;

  return (
    <>
      <Sidebar />
      <main
        className={cn(
          "min-h-[calc(100vh-56px)] bg-zinc-50 transition-[margin-left] duration-300 ease-in-out dark:bg-zinc-900",
          sidebar?.isOpen === false ? "lg:ml-[90px]" : "lg:ml-72",
        )}
      >
        {children}
      </main>
      <footer
        className={cn(
          "transition-[margin-left] duration-300 ease-in-out",
          sidebar?.isOpen === false ? "lg:ml-[90px]" : "lg:ml-72",
        )}
      >
        <AdminFooter />
      </footer>
    </>
  );
}
