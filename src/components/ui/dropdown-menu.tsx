/**
 * Dropdown Menu Component
 * Based on Radix UI primitives
 */

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from './utils';

const DropdownMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { open?: boolean; onOpenChange?: (open: boolean) => void }
>(({ children, open, onOpenChange, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(open ?? false);
  const triggerRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onOpenChange?.(newState);
  };

  return (
      <div ref={ref} className="relative" {...props}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as any, {
              isOpen,
              onToggle: handleToggle,
              triggerRef,
            });
          }
          return child;
        })}
      </div>
  );
});
DropdownMenu.displayName = 'DropdownMenu';

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; isOpen?: boolean; onToggle?: () => void; triggerRef?: React.RefObject<HTMLElement | null> }
>(({ className, children, asChild = false, isOpen, onToggle, triggerRef, ...props }, ref) => {
  const setRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      if (triggerRef) (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
    },
    [ref, triggerRef]
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as any, {
      ref: setRef,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggle?.();
        (children as any).props.onClick?.(e);
      },
    });
  }

  return (
    <button
      ref={setRef}
      className={cn('inline-flex items-center justify-center', className)}
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.();
      }}
      {...props}
    >
      {children}
    </button>
  );
});
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: 'start' | 'center' | 'end';
    isOpen?: boolean;
    onToggle?: () => void;
    triggerRef?: React.RefObject<HTMLElement | null>;
    /** When true, render in a portal with fixed position — avoids scrollbar in overflow containers */
    portal?: boolean;
  }
>(({ className, align = 'center', isOpen, children, onToggle, triggerRef, portal = true, ...props }, ref) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });

  React.useLayoutEffect(() => {
    if (isOpen && portal && triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: align === 'end' ? rect.right : align === 'start' ? rect.left : rect.left + rect.width / 2,
      });
    }
  }, [isOpen, portal, triggerRef, align]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inContent = contentRef.current?.contains(target);
      const inTrigger = triggerRef?.current?.contains(target) ?? false;
      if (!inContent && !inTrigger) onToggle?.();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onToggle?.();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onToggle, triggerRef]);

  if (!isOpen) return null;

  const usePortal = portal && triggerRef?.current;

  const content = (
    <div
      ref={(node) => {
        contentRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={cn(
        'z-[100] min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 shadow-lg',
        usePortal ? '' : 'absolute mt-2',
        !usePortal && (align === 'start' ? 'left-0' : align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2'),
        className
      )}
      style={usePortal ? { position: 'fixed' as const, top: position.top, left: position.left, transform: align === 'center' ? 'translateX(-50%)' : align === 'end' ? 'translateX(-100%)' : undefined } : undefined}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && (child.type as { displayName?: string })?.displayName === 'DropdownMenuItem') {
          return React.cloneElement(child as React.ReactElement<{ onToggle?: () => void }>, { onToggle });
        }
        return child;
      })}
    </div>
  );

  if (usePortal && typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }
  return content;
});
DropdownMenuContent.displayName = 'DropdownMenuContent';

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { onToggle?: (() => void); disabled?: boolean }
>(({ className, onClick, onToggle, disabled, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent',
      disabled && 'pointer-events-none opacity-50',
      className
    )}
    onClick={(e) => {
      if (disabled) return;
      onClick?.(e);
      onToggle?.();
    }}
    {...props}
  />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('px-2 py-1.5 text-sm font-semibold', className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-border', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};