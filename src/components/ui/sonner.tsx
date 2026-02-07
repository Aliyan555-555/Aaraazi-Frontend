"use client";

import { useTheme } from "next-themes@0.4.6";
import { Toaster as Sonner, ToasterProps } from "sonner@2.0.3";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          // PHASE 5: Apply brand semantic colors to toast variants
          toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          success: 'group-[.toaster]:bg-success-bg group-[.toaster]:text-success group-[.toaster]:border-success-border',
          error: 'group-[.toaster]:bg-destructive-bg group-[.toaster]:text-destructive group-[.toaster]:border-destructive-border',
          warning: 'group-[.toaster]:bg-warning-bg group-[.toaster]:text-warning-foreground group-[.toaster]:border-warning-border',
          info: 'group-[.toaster]:bg-info-bg group-[.toaster]:text-info-foreground group-[.toaster]:border-info-border',
        },
      }}
      style={
        {
          "--normal-bg": "var(--background)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--success-bg)",
          "--success-text": "var(--success)",
          "--success-border": "var(--success-border)",
          "--error-bg": "var(--destructive-bg)",
          "--error-text": "var(--destructive)",
          "--error-border": "var(--destructive-border)",
          "--warning-bg": "var(--warning-bg)",
          "--warning-text": "var(--warning-foreground)",
          "--warning-border": "var(--warning-border)",
          "--info-bg": "var(--info-bg)",
          "--info-text": "var(--info-foreground)",
          "--info-border": "var(--info-border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };