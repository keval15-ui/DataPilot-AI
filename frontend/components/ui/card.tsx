import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export function Card({ children, className, hover = true }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_20px_80px_-30px_rgba(2,132,199,0.45)] backdrop-blur-xl",
        hover && "transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/30 hover:shadow-[0_25px_80px_-25px_rgba(56,189,248,0.4)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
