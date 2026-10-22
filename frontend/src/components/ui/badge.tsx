import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80 dark:bg-slate-800 dark:text-slate-100',
        secondary:
          'border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-200',
        destructive:
          'border-transparent bg-red-600 text-white hover:bg-red-600/80 dark:bg-red-900 dark:text-red-100',
        outline: 'text-slate-950 dark:text-slate-50 border-slate-300 dark:border-slate-800',
        success: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium',
        warning: 'border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium',
        danger: 'border-red-500/30 bg-red-500/15 text-red-600 dark:text-red-400 font-medium',
        purple: 'border-purple-500/30 bg-purple-500/15 text-purple-600 dark:text-purple-400 font-medium',
        'phase-r': 'border-red-500/40 bg-red-500/15 text-red-600 dark:text-red-400 font-bold',
        'phase-s': 'border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold',
        'phase-t': 'border-blue-500/40 bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold',
        'phase-kwh': 'border-purple-500/40 bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
