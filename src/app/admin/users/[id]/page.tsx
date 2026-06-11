import { notFound } from "next/navigation";
import Link from "next/link";

import { api } from "~/trpc/server";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

import { TrailHeader } from "../../_components/trail-header";
import { UserDetailActions } from "./user-detail-actions";

type Props = {
  params: Promise<{ id: string }>;
};

const roleBadge = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "ARTISAN":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "MANAGER":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    case "DRIVER":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    case "USER":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "GUEST":
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await api.user.getUserDetail({ userId: id });

  if (!user) notFound();

  const initials = (user.name ?? user.email ?? "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const authMethodLabel =
    user.authProviders.length > 0
      ? user.authProviders
          .map((p) => (p === "credential" ? "Email/Password" : p))
          .join(", ")
      : "—";

  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Platform Users", href: "/admin/users" },
          { label: user.name ?? user.email ?? id },
        ]}
      />
      <div className="admin-container space-y-6">
        {/* Header card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={user.image ?? undefined}
                    alt={user.name ?? "User"}
                  />
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h1 className="text-xl font-semibold">{user.name ?? "—"}</h1>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge(user.role)}`}
                    >
                      {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {authMethodLabel}
                    </span>
                    {user.emailVerified && (
                      <span className="text-xs text-green-600 dark:text-green-400">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Joined {user.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>

              <UserDetailActions
                userId={user.id}
                userName={user.name}
                userEmail={user.email}
                currentRole={user.role}
                hasCredential={user.hasCredential}
              />
            </div>
          </CardContent>
        </Card>

        {/* Shops */}
        {user.shops.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Shops ({user.shops.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {user.shops.map((shop) => (
                  <li
                    key={shop.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <Link
                        href={`/admin/shops/${shop.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {shop.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {shop._count.products} product
                        {shop._count.products !== 1 ? "s" : ""} ·{" "}
                        {shop._count.services} service
                        {shop._count.services !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Forum activity */}
        {(user._count.posts > 0 || user._count.forumComments > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Forum activity</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted-foreground">Posts</dt>
                  <dd className="text-2xl font-semibold">{user._count.posts}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Comments</dt>
                  <dd className="text-2xl font-semibold">
                    {user._count.forumComments}
                  </dd>
                </div>
                {user._count.createdSubreddits > 0 && (
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Communities created
                    </dt>
                    <dd className="text-2xl font-semibold">
                      {user._count.createdSubreddits}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Surveys */}
        {(user.artisanSurveys.length > 0 || user._count.guestSurveys > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Surveys</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.artisanSurveys.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Artisan surveys ({user.artisanSurveys.length})
                  </p>
                  <ul className="divide-y">
                    {user.artisanSurveys.map((survey) => (
                      <li key={survey.id} className="py-1.5">
                        <p className="text-sm font-medium">{survey.businessName}</p>
                        <p className="text-xs text-muted-foreground">
                          {survey.createdAt.toLocaleDateString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {user._count.guestSurveys > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Guest surveys
                  </p>
                  <p className="text-2xl font-semibold">
                    {user._count.guestSurveys}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Websites */}
        {user._count.websiteProvision > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Websites ({user._count.websiteProvision})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {user._count.websiteProvision} website provision
                {user._count.websiteProvision !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Upcycle results */}
        {user._count.upcycleResults > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Upcycle results ({user._count.upcycleResults})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {user._count.upcycleResults} upcycle result
                {user._count.upcycleResults !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

export const metadata = {
  title: "User Detail",
};
