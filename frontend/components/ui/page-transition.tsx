import { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  return <div className="transition-opacity duration-300 ease-out">{children}</div>;
}
