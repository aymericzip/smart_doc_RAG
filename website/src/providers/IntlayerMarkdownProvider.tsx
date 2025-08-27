"use client";

import { MarkdownRenderer } from "@components/MarkdownRender";
import { MarkdownProvider } from "next-intlayer";
import type { FC, PropsWithChildren } from "react";

export const IntlayerMarkdownProvider: FC<PropsWithChildren> = ({
  children,
}) => (
  <MarkdownProvider
    renderMarkdown={(markdown) => (
      <MarkdownRenderer>{markdown}</MarkdownRenderer>
    )}
  >
    {children}
  </MarkdownProvider>
);
