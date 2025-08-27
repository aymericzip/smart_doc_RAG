import type { FC, HTMLAttributes, ReactNode } from 'react';
import { useState } from 'react';
import { cn } from '../../utils/cn';

interface ExpandCollapseProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  trigger?: ReactNode;
}

export const ExpandCollapse: FC<ExpandCollapseProps> = ({ 
  className,
  children,
  isExpanded = false,
  onToggle,
  trigger,
  ...props 
}) => {
  const [expanded, setExpanded] = useState(isExpanded);

  const handleToggle = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  return (
    <div className={cn('expand-collapse', className)} {...props}>
      {trigger && (
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          {trigger}
          <span className={cn(
            'transition-transform duration-200',
            expanded ? 'rotate-90' : 'rotate-0'
          )}>
            ▶
          </span>
        </button>
      )}
      <div className={cn(
        'overflow-hidden transition-all duration-200',
        expanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
      )}>
        {children}
      </div>
    </div>
  );
};
