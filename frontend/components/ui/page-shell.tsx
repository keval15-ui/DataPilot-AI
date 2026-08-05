import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageShellProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PageShell({ title, description, action, children, className }: PageShellProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
          {description ? <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
