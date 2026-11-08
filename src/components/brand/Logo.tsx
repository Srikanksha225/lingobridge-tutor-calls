import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7", className)}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M7 20.5c2.6-5.2 5.6-7.8 9-7.8s6.4 2.6 9 7.8"
        fill="none"
        strokeWidth="2.2"
        strokeLinecap="round"
        className="stroke-primary-foreground"
      />
      <path d="M7 20.5h18" strokeWidth="2.2" strokeLinecap="round" className="stroke-teal" />
      <circle cx="16" cy="9.2" r="1.7" className="fill-teal" />
    </svg>
  );
}

export function Logo({ to = "/", className }: { to?: "/" | "/home"; className?: string }) {
  return (
    <Link
      to={to}
      className={cn("flex items-center gap-2.5", className)}
      aria-label="LingoBridge AI home"
    >
      <LogoMark />
      <span className="font-display text-[1.2rem] font-medium tracking-tight">
        LingoBridge <span className="text-teal">AI</span>
      </span>
    </Link>
  );
}
