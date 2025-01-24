import { Navbar } from "~/components/admin/navbar";

type Props = {
  title: string;
  children: React.ReactNode;
};

export function ContentLayout({ title, children }: Props) {
  return (
    <div>
      <Navbar title={title} />
      <div className="container px-4 pb-8 pt-8 sm:px-8">{children}</div>
    </div>
  );
}
