"use client";

import type { LucideType } from "lucide-react";
import type { ChangeEvent } from "react";
import React from "react";

type Props = {
  title: string;
  Icon: typeof LucideType;
  handleHours?: (e: number) => void;
};
export const FormInput = ({ title, Icon, handleHours }: Props) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (handleHours) return handleHours(parseFloat(e.target.value));
    return;
  };
  return (
    <>
      <label
        htmlFor={title}
        className="sr-only block text-sm leading-6 font-medium text-gray-900"
      >
        {title}
      </label>
      <div className="relative mt-2 rounded-md shadow-sm">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Icon color="gray.300" />
          {!handleHours && <>&nbsp;$</>}
        </div>
        <input
          type="number"
          name="price"
          id={title}
          className={`block w-full rounded-md border-0 py-1.5 ${
            handleHours ? "pl-8" : "pl-11"
          } pr-20 text-gray-900 ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 focus:ring-inset sm:text-sm sm:leading-6`}
          placeholder={handleHours ? "Number of hours (est.)" : title}
          onChange={handleChange}
        />
      </div>
    </>
  );
};
