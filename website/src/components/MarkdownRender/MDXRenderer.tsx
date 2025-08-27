"use client";

import type { FC } from "react";
import { useMemo } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeReact from "rehype-react";
import * as runtime from "react/jsx-runtime";
import { cn } from "../../utils/cn";
import { H1, H2, H3, H4 } from "../Headers";
import { Code } from "../IDE/Code";
import { CodeProvider } from "../IDE/CodeContext";
import { Table } from "../Table";
import { Link } from "../Link/Link";
import { LocalesValues } from "intlayer";

type MDXRendererProps = {
  children: string;
  isDarkMode?: boolean;
  locale?: LocalesValues;
  className?: string;
};

/**
 * Removes frontmatter from markdown content
 * Frontmatter is the YAML metadata block at the beginning of markdown files
 * delimited by --- at the start and end
 */
const stripFrontmatter = (markdown: string): string => {
  const lines = markdown.split(/\r?\n/);

  // Check if the very first non-empty line is the metadata start delimiter
  const firstNonEmptyLine = lines.find((line) => line.trim() !== "");

  if (!firstNonEmptyLine || firstNonEmptyLine.trim() !== "---") {
    // No frontmatter, return original content
    return markdown;
  }

  let inMetadataBlock = false;
  let endOfMetadataIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();

    // Toggle metadata block on encountering the delimiter
    if (trimmedLine === "---") {
      if (!inMetadataBlock) {
        // Begin metadata block
        inMetadataBlock = true;
        continue;
      } else {
        // End of metadata block
        endOfMetadataIndex = i;
        break;
      }
    }
  }

  if (endOfMetadataIndex > -1) {
    // Return content after the frontmatter
    return lines.slice(endOfMetadataIndex + 1).join("\n");
  }

  // If we couldn't find the end delimiter, return original content
  return markdown;
};

export const MDXRenderer: FC<MDXRendererProps> = ({
  children,
  isDarkMode,
  locale,
  className,
}) => {
  const content = useMemo(() => {
    try {
      const cleanMarkdown = stripFrontmatter(children || "");

      // Create components with proper context
      const components = {
        h1: (props: any) => <H1 isClickable={true} {...props} />,
        h2: (props: any) => <H2 isClickable={true} {...props} />,
        h3: (props: any) => <H3 isClickable={true} {...props} />,
        h4: (props: any) => <H4 isClickable={true} {...props} />,
        p: ({ className, ...props }: any) => (
          <p className={cn("text-neutral mt-3", className)} {...props} />
        ),

        code: (props: any) =>
          typeof props.className === "undefined" ? (
            <strong className="bg-card/60 rounded p-1 shadow-[0_0_10px_-15px_rgba(0,0,0,0.3)] backdrop-blur">
              {props.children}
            </strong>
          ) : (
            <Code
              isDarkMode={isDarkMode}
              language={props.className?.replace("language-", "")}
              {...props}
            />
          ),

        blockquote: ({ className, ...props }: any) => (
          <blockquote
            className={cn(
              "border-card text-neutral mt-5 flex flex-col gap-3 border-l-4 pl-5",
              className
            )}
            {...props}
          />
        ),

        ul: ({ className, ...props }: any) => (
          <ul
            className={cn("mt-5 flex flex-col gap-3 pl-5 list-disc", className)}
            {...props}
          />
        ),

        ol: ({ className, ...props }: any) => (
          <ol
            className={cn(
              "mt-5 flex flex-col gap-3 pl-5 list-decimal",
              className
            )}
            {...props}
          />
        ),

        li: ({ className, ...props }: any) => (
          <li className={cn("", className)} {...props} />
        ),

        img: ({ className, ...props }: any) => (
          <img
            {...props}
            loading="lazy"
            className={cn("max-w-full rounded-md", className)}
            src={`${props.src}?raw=true`}
          />
        ),

        a: (props: any) => (
          <Link
            color="neutral"
            isExternalLink={props.href?.startsWith("http")}
            underlined={true}
            locale={locale}
            label={typeof props.children === "string" ? props.children : "Link"}
            {...props}
          />
        ),

        pre: (props: any) => props.children,
        table: (props: any) => <Table {...props} />,

        th: ({ className, ...props }: any) => (
          <th
            className={cn(
              "border-neutral bg-neutral/10 border-b p-4",
              className
            )}
            {...props}
          />
        ),

        tr: ({ className, ...props }: any) => (
          <tr
            className={cn("hover:bg-neutral/10 hover:/10", className)}
            {...props}
          />
        ),

        td: ({ className, ...props }: any) => (
          <td
            className={cn("border-b border-neutral-500/50 p-4", className)}
            {...props}
          />
        ),

        hr: ({ className, ...props }: any) => (
          <hr className={cn("mt-16 mx-6 text-neutral", className)} {...props} />
        ),
      };

      // Process the markdown content
      const processor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeReact, {
          // @ts-ignore - runtime types are compatible
          ...runtime,
          components,
        });

      const result = processor.processSync(cleanMarkdown);
      return result.result;
    } catch (error) {
      console.error("Markdown processing error:", error);
      return (
        <div className="text-red-500 p-4 border border-red-300 rounded">
          <h3>Markdown Processing Error:</h3>
          <pre className="text-sm mt-2">
            {error instanceof Error ? error.message : "Unknown error"}
          </pre>
        </div>
      );
    }
  }, [children, isDarkMode, locale]);

  return (
    <CodeProvider>
      <div className={className}>{content}</div>
    </CodeProvider>
  );
};
