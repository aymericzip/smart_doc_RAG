"use client";

import { Container } from "@components/Container";
import { MarkdownRenderer } from "@components/MarkdownRender";
import type { FC } from "react";

type CodeRenderProps = {
  content: string;
};

export const CodeRender: FC<CodeRenderProps> = ({ content }) => {
  return (
    <Container>
      <MarkdownRenderer>{content}</MarkdownRenderer>
    </Container>
  );
};
