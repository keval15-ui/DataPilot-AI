type IconProps = {
  size?: number;
  className?: string;
};

export function SparklesIcon({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} width={size} height={size}>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
      <path d="M5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15z" />
    </svg>
  );
}

export function ShieldCheckIcon({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} width={size} height={size}>
      <path d="M12 3l7 3v5c0 4.4-2.8 7.6-7 10-4.2-2.4-7-5.6-7-10V6l7-3z" />
      <path d="M9.5 12.5l1.8 1.8 3.2-4" />
    </svg>
  );
}

export function ZapIcon({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} width={size} height={size}>
      <path d="M13 2L4 13h6l-1 9 9-11h-6l1-9z" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} width={size} height={size}>
      <path d="M5 12h14" />
      <path d="M13 5l7 7-7 7" />
    </svg>
  );
}

export function LayoutDashboardIcon({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} width={size} height={size}>
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="4" width="7" height="4" rx="2" />
      <rect x="13" y="12" width="7" height="8" rx="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" />
    </svg>
  );
}

export function MessageSquareTextIcon({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} width={size} height={size}>
      <path d="M7 7h10" />
      <path d="M7 11h7" />
      <path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 3V6a2 2 0 0 1 2-2z" />
    </svg>
  );
}

export function UploadIcon({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} width={size} height={size}>
      <path d="M12 3v12" />
      <path d="M7 8l5-5 5 5" />
      <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function SettingsIcon({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} width={size} height={size}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7.2 7.2 0 0 0-.1-1.1l2.1-1.6-2-3.5-2.5 1a7.6 7.6 0 0 0-1.9-1.1L14.5 2h-5l-.8 2.7a7.6 7.6 0 0 0-1.9 1.1l-2.5-1-2 3.5 2.1 1.6A7.2 7.2 0 0 0 5 12c0 .4 0 .7.1 1.1l-2.1 1.6 2 3.5 2.5-1a7.6 7.6 0 0 0 1.9 1.1L9.5 22h5l.8-2.7a7.6 7.6 0 0 0 1.9-1.1l2.5 1 2-3.5-2.1-1.6c.1-.3.1-.7.1-1.1z" />
    </svg>
  );
}

export function HistoryIcon({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} width={size} height={size}>
      <path d="M12 7v5l3 2" />
      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
    </svg>
  );
}

export function PanelLeftCloseIcon({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} width={size} height={size}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M10 8l-4 4 4 4" />
      <path d="M6 12h8" />
    </svg>
  );
}

export function PanelLeftOpenIcon({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} width={size} height={size}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M14 8l4 4-4 4" />
      <path d="M18 12H10" />
    </svg>
  );
}

export function LockIcon({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} width={size} height={size}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V8a4 4 0 1 1 8 0v2" />
    </svg>
  );
}

export function BellIcon({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} width={size} height={size}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9z" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
