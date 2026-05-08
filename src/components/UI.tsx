import React from 'react';
import { cn } from '../lib/utils';

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }
>(({ className, variant = 'primary', ...props }, ref) => {
  const variants = {
    primary: 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm shadow-teal-100',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-500',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200',
  };

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
        variants[variant],
        className
      )}
      {...props}
    />
  );
});

export const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn('bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/40', className)}>
    {children}
  </div>
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);
