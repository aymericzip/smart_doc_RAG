import { MarkdownRenderer } from "@components/MarkdownRender";
import { cn } from "@utils/cn";
import type { FC, HTMLAttributes } from "react";

export enum ChatBumbleType {
  QUESTION = "question",
  ANSWER = "answer",
}

type ChatBumbleProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  type: ChatBumbleType;
  children: string;
};

export const ChatBumble: FC<ChatBumbleProps> = ({
  children,
  type,
  ...props
}) => {
  return (
    <div
      className={cn(
        type === ChatBumbleType.QUESTION &&
          "bg-text/95 text-text-opposite ml-auto mr-4 w-auto max-w-[90%] whitespace-pre-wrap rounded-xl rounded-tr-none px-8 py-2",
        type === ChatBumbleType.ANSWER && "w-full px-4"
      )}
      {...props}
    >
      {type === ChatBumbleType.ANSWER ? (
        <MarkdownRenderer>{children}</MarkdownRenderer>
      ) : (
        children
      )}
    </div>
  );
};
