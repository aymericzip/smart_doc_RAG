import type { FC } from "react";
import { LocalesValues } from "intlayer";
import { MDXRenderer } from "./MDXRenderer";

type MarkdownRendererProps = {
  children: string;
  isDarkMode?: boolean;
  locale?: LocalesValues;
};

export const MarkdownRenderer: FC<MarkdownRendererProps> = ({
  children,
  isDarkMode,
  locale,
}) => {
  return (
    <MDXRenderer isDarkMode={isDarkMode} locale={locale}>
      {children}
    </MDXRenderer>
  );
};
