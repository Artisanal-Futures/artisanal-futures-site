import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

type Props = {
  link: string;
  title: string;
  icon: React.ReactNode;
  description: string;
};
export const HomePageCard = ({ link, title, icon, description }: Props) => (
  <Link href={link}>
    <Card className="hover:bg-background/50 dark:border-accent/20 dark:bg-background/50 dark:hover:border-accent/30 dark:hover:bg-background/75 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground dark:text-muted-foreground/80 text-sm font-medium">
          {description}
        </CardTitle>
        <div className="text-muted-foreground/70 dark:text-muted-foreground/60">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-foreground dark:text-foreground/90 text-2xl font-bold">
          {title}
        </div>
      </CardContent>
    </Card>
  </Link>
);
