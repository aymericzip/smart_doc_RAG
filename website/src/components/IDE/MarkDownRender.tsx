import type { FC } from "react";
import { useMemo } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeReact from "rehype-react";
import * as runtime from "react/jsx-runtime";
import { createElement, Fragment } from "react";
import { Code } from "./Code";

type MarkdownRendererProps = {
  isDarkMode?: boolean;
  children: string;
};

export const MarkdownRenderer: FC<MarkdownRendererProps> = ({
  children,
  isDarkMode,
}) => {
  const content = useMemo(() => {
    try {
      // Create components for the IDE markdown renderer
      const components = {
        code: (props: any) => (
          <Code
            {...props}
            isDarkMode={isDarkMode}
            language={props.className?.replace("language-", "")}
            showHeader={false}
            className="text-xs leading-5"
          />
        ),
        pre: (props: any) => props.children,
      };

      // Process the markdown content
      const processor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeReact, {
          jsx: createElement,
          jsxs: createElement,
          Fragment: Fragment,
          components,
        });

      const result = processor.processSync(children || "");
      return result.result;
    } catch (error) {
      console.error("Markdown processing error:", error);
      return (
        <div className="text-red-500">
          Error processing markdown:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
      );
    }
  }, [children, isDarkMode]);

  return <>{content}</>;
};
