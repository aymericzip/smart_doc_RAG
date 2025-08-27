"use client";

import { MarkdownRenderer } from "@components/MarkdownRender";
import { cn } from "@utils/cn";
import { useLocale } from "next-intlayer";
import type { FC } from "react";
import { SectionScroller } from "./SectionScroller";

type DocumentationRenderProps = {
  children: string;
};

export const DocumentationRender: FC<DocumentationRenderProps> = ({
  children,
}) => {
  const { locale } = useLocale();

  return (
    <div className="flex flex-col gap-8 p-10">
      <MarkdownRenderer
        locale={locale}
        options={{
          wrapper: ({ className, ...props }) => (
            <>
              <SectionScroller />
              <div
                className={cn("flex flex-col gap-8 p-10", className)}
                {...props}
              />
            </>
          ),
        }}
      >
        {children}
      </MarkdownRenderer>
    </div>
  );
};
