import { UserNav } from "~/components/layout/user-nav";
import { SheetMenu } from "~/components/admin/sheet-menu";
import { ModeToggle } from "~/components/common/mode-toggle";

type Props = {
  title: string;
};

export function Navbar({ title }: Props) {
  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 dark:shadow-secondary sticky top-0 z-10 w-full shadow backdrop-blur">
      <div className="mx-4 flex h-14 items-center sm:mx-8">
        <div className="flex items-center space-x-4 lg:space-x-0">
          <SheetMenu />
          <h1 className="font-bold">{title}</h1>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
