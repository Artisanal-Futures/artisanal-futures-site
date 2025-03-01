"use client";

export const CustomCodeRenderer = ({ data }: { data: { code?: unknown } }) => {
  data;

  return (
    <pre className="rounded-md bg-gray-800 p-4">
      <code className="text-sm text-gray-100">
        {(data as { code: string }).code}
      </code>
    </pre>
  );
};
