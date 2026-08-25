import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type UniversalActionKind = "likeLocker" | "wishLocker" | "like" | "shop" | "share" | "report" | "follow" | "notify";

type ActionPresentation = {
  icon?: string;
  activeIcon?: string;
  label: string;
  activeLabel?: string;
  inactiveAria?: string;
  activeAria?: string;
};

export const UNIVERSAL_ACTIONS: Record<UniversalActionKind, ActionPresentation> = {
  likeLocker: { icon: "♡", activeIcon: "♥", label: "LikeLocker", activeLabel: "In LikeLocker", inactiveAria: "Add to LikeLocker", activeAria: "Remove from LikeLocker" },
  wishLocker: { label: "Wish Locker", activeLabel: "In Wish Locker", inactiveAria: "Add to Wish Locker", activeAria: "Remove from Wish Locker" },
  like: { icon: "♡", activeIcon: "♥", label: "Like", activeLabel: "Unlike", inactiveAria: "Like", activeAria: "Unlike" },
  shop: { icon: "🛒", label: "Shop" },
  share: { icon: "↗", label: "Share" },
  report: { icon: "⚑", label: "Report" },
  follow: { icon: "👤+", activeIcon: "👤✓", label: "Follow", activeLabel: "Following" },
  notify: { icon: "🔔", label: "Notify", activeLabel: "Notifications on", inactiveAria: "Notify me", activeAria: "Notifications on" },
};

function WishLockerIcon({ active = false }: { active?: boolean }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <path d="M5.6 9.2h12.8l1 12.2H4.6l1-12.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M8.5 9.5V7.2a3.5 3.5 0 0 1 7 0v2.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M12 18.9s-3.7-2.2-3.7-4.5c0-1.15.9-2.05 2.05-2.05.72 0 1.35.36 1.65.93.3-.57.93-.93 1.65-.93 1.15 0 2.05.9 2.05 2.05 0 2.3-3.7 4.5-3.7 4.5Z" fill={active?"currentColor":"none"} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>;
}

function presentation(action: UniversalActionKind, active = false) {
  const item = UNIVERSAL_ACTIONS[action];
  const label = active && item.activeLabel ? item.activeLabel : item.label;
  const aria = active ? (item.activeAria ?? label) : (item.inactiveAria ?? label);
  const icon = active && item.activeIcon ? item.activeIcon : item.icon;
  return { label, aria, icon };
}

function ActionIcon({ action, active, icon }: { action: UniversalActionKind; active: boolean; icon?: string }) {
  return action === "wishLocker" ? <WishLockerIcon active={active}/> : <>{icon}</>;
}

export function UniversalActionBar({ children, className, ariaLabel = "Actions" }: { children: ReactNode; className?: string; ariaLabel?: string }) {
  return <div className={className} aria-label={ariaLabel}>{children}</div>;
}

type CommonActionProps = {
  action: UniversalActionKind;
  active?: boolean;
  className?: string;
  count?: ReactNode;
  countClassName?: string;
  showLabel?: boolean;
  ariaLabel?: string;
  title?: string;
};

export function UniversalActionButton({ action, active = false, className, count, countClassName, showLabel = false, ariaLabel, title, ...props }: CommonActionProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label" | "title">) {
  const item = presentation(action, active);
  const visibleCount = action === "wishLocker" ? undefined : count;
  return <button {...props} className={className} aria-label={ariaLabel ?? item.aria} title={title ?? item.label} aria-pressed={action === "likeLocker" || action === "wishLocker" || action === "like" || action === "follow" || action === "notify" ? active : undefined}>
    <span aria-hidden="true"><ActionIcon action={action} active={active} icon={item.icon}/></span>
    {showLabel ? <span>{item.label}</span> : null}
    {visibleCount !== undefined ? <span className={countClassName}>{visibleCount}</span> : null}
  </button>;
}

export function UniversalActionLink({ action, href, active = false, className, count, countClassName, showLabel = false, ariaLabel, title, prefetch = false, target, rel }: CommonActionProps & { href: string; prefetch?: boolean; target?: string; rel?: string }) {
  const item = presentation(action, active);
  const visibleCount = action === "wishLocker" ? undefined : count;
  return <Link className={className} href={href} prefetch={prefetch} target={target} rel={rel} aria-label={ariaLabel ?? item.aria} title={title ?? item.label}>
    <span aria-hidden="true"><ActionIcon action={action} active={active} icon={item.icon}/></span>
    {showLabel ? <span>{item.label}</span> : null}
    {visibleCount !== undefined ? <span className={countClassName}>{visibleCount}</span> : null}
  </Link>;
}

export function UniversalActionSummary({ action = "report", active = false, className, showLabel = false, ariaLabel, title }: Pick<CommonActionProps, "active" | "className" | "showLabel" | "ariaLabel" | "title"> & { action?: UniversalActionKind }) {
  const item = presentation(action, active);
  return <summary className={className} aria-label={ariaLabel ?? item.aria} title={title ?? item.label}>
    <span aria-hidden="true"><ActionIcon action={action} active={active} icon={item.icon}/></span>{showLabel ? <span>{item.label}</span> : null}
  </summary>;
}
