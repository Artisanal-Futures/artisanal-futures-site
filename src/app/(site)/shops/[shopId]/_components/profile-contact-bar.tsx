"use client";

import { Fragment } from "react";
import { Globe, Mail, Phone } from "lucide-react";

type ArtisanLinks = {
  website: string | undefined | null;
  email: string | undefined | null;
  phone: string | undefined | null;
};

export const ProfileContactBar = ({ website, email, phone }: ArtisanLinks) => {
  const contactMethods = [
    {
      icon: <Mail className="h-4 w-4" />,
      value: email,
      placeholder: "No email provided",
    },
    {
      icon: <Globe className="h-4 w-4" />,
      value: website,
      placeholder: "No website provided",
    },
    {
      icon: <Phone className="h-4 w-4" />,
      value: phone,
      placeholder: "No phone provided",
    },
  ].filter((method) => method.value);

  if (contactMethods.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full flex-col bg-slate-200/25 p-4">
      <div className="flex w-full flex-col justify-around text-sm font-light max-lg:space-y-3 lg:flex-row">
        {contactMethods.map((method, index) => (
          <Fragment key={index}>
            <span className="flex items-center gap-2">
              {method.icon}
              <span className="text-muted-foreground">
                {method.value ?? method.placeholder}
              </span>
            </span>
            {index < contactMethods.length - 1 && (
              <span className="text-muted-foreground max-lg:hidden">•</span>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
};
