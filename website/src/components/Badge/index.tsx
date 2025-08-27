import type { FC, HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export enum BadgeColor {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  NEUTRAL = 'neutral'
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
  variant?: 'solid' | 'outline' | 'soft';
}

export const Badge: FC<BadgeProps> = ({ 
  color = BadgeColor.NEUTRAL, 
  variant = 'solid',
  className,
  children,
  ...props 
}) => {
  const colorClasses = {
    [BadgeColor.PRIMARY]: {
      solid: 'bg-primary text-primary-foreground',
      outline: 'border border-primary text-primary',
      soft: 'bg-primary/10 text-primary'
    },
    [BadgeColor.SECONDARY]: {
      solid: 'bg-secondary text-secondary-foreground',
      outline: 'border border-secondary text-secondary',
      soft: 'bg-secondary/10 text-secondary'
    },
    [BadgeColor.SUCCESS]: {
      solid: 'bg-success text-success-foreground',
      outline: 'border border-success text-success',
      soft: 'bg-success/10 text-success'
    },
    [BadgeColor.WARNING]: {
      solid: 'bg-warning text-warning-foreground',
      outline: 'border border-warning text-warning',
      soft: 'bg-warning/10 text-warning'
    },
    [BadgeColor.ERROR]: {
      solid: 'bg-error text-error-foreground',
      outline: 'border border-error text-error',
      soft: 'bg-error/10 text-error'
    },
    [BadgeColor.NEUTRAL]: {
      solid: 'bg-neutral text-neutral-foreground',
      outline: 'border border-neutral text-neutral',
      soft: 'bg-neutral/10 text-neutral'
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClasses[color][variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

