/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
"use client";

import type { FC } from "react";
import dynamic from "next/dynamic";

import { CustomCodeRenderer } from "~/app/forums/_components/renderers/custom-code-renderer";
import { CustomImageRenderer } from "~/app/forums/_components/renderers/custom-image-renderer";

const Output = dynamic(
  async () => (await import("editorjs-react-renderer")).default,
  { ssr: false },
);

type Props = {
  content: unknown;
};

const renderers = {
  image: CustomImageRenderer,
  code: CustomCodeRenderer,
};

const style = {
  paragraph: {
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
};

export const EditorOutput: FC<Props> = ({ content }) => {
  return (
    <Output
      style={style}
      className="text-sm"
      renderers={renderers}
      data={JSON.parse(content as string) as unknown}
    />
  );
};
