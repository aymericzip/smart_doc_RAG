import type { FC, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface CommandProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface CommandRootProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Command: FC<CommandProps> = ({ 
  className,
  children,
  ...props 
}) => {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CommandRoot: FC<CommandRootProps> = ({ 
  className,
  children,
  ...props 
}) => {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

