import { cn } from "@utils/cn";
import type { DetailedHTMLProps, FC, HTMLAttributes, ReactNode } from "react";

export type PageContentLayoutProps = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  footer?: ReactNode;
  navbar?: ReactNode;
};

export const PageContentLayout: FC<PageContentLayoutProps> = ({
  navbar,
  children,
  footer,
  className,
  ...props
}) => (
  <main
    className={cn("relative flex w-full flex-1 flex-col", className)}
    {...props}
  >
    {children}
  </main>
);
