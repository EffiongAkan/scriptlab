
import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ScriptPaperProps extends React.HTMLAttributes<HTMLDivElement> { }
interface ScriptTitleProps extends React.HTMLAttributes<HTMLDivElement> { }

export const ScriptPaper = forwardRef<HTMLDivElement, ScriptPaperProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // A4 paper dimensions: 210mm x 297mm (8.27in x 11.69in)
          'w-full max-w-[210mm] mx-auto my-4 md:my-8',
          'p-4 md:p-[25mm] md:pt-[25mm] md:pb-[25mm]', // Responsive margins: small on mobile, A4 on desktop
          'bg-white text-black',
          'shadow-sm md:shadow-[0_2px_8px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.08)]',
          'rounded-sm',
          'overflow-visible',
          'cursor-text',
          'relative',
          // Add page break styling for print
          'print:shadow-none print:my-0',
          className
        )}
        style={{
          ...props.style,
          // Ensure A4 dimensions are maintained
          maxWidth: '210mm',
          pageBreakAfter: 'always',
          pageBreakInside: 'avoid',
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ScriptPaper.displayName = 'ScriptPaper';

export const ScriptTitle = forwardRef<HTMLDivElement, ScriptTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'text-center text-2xl font-bold mb-12 uppercase',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ScriptTitle.displayName = 'ScriptTitle';
