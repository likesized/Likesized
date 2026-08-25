import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type UniversalActionKind = "likeLocker" | "wishLocker" | "like" | "shop" | "share" | "report" | "follow" | "notify";

type ActionPresentation = {
  icon: string;
  activeIcon?: string;
  label: string;
  activeLabel?: string;
  inactiveAria?: string;
  activeAria?: string;
};

export const UNIVERSAL_ACTIONS: Record<UniversalActionKind, ActionPresentation> = {
  likeLocker: { icon: "♡", activeIcon: "♥", label: "LikeLocker", activeLabel: "In LikeLocker", inactiveAria: "Add to LikeLocker", activeAria: "Remove from LikeLocker" },
  wishLocker: { icon: "🛍♡", activeIcon: "🛍♥", label: "Wishlist", activeLabel: "In Wishlist", inactiveAria: "Add to Wishlist", activeAria: "Remove from Wishlist" },
  like: { icon: "♡", activeIcon: "♥", label: "Like", activeLabel: "Unlike", inactiveAria: "Like", activeAria: "Unlike" },
  shop: { icon: "🛒", label: "Shop" },
  share: { icon: "↗", label: "Share" },
  report: { icon: "⚑", label: "Report" },
  follow: { icon: "👤+", activeIcon: "👤✓", label: "Follow", activeLabel: "Following" },
  notify: { icon: "🔔", label: "Notify", activeLabel: "Notifications on", inactiveAria: "Notify me", activeAria: "Notifications on" },
};

function presentation(action: UniversalActionKind, active = false) {
  const item = UNIVERSAL_ACTIONS[action];
  const label = active && item.activeLabel ? item.activeLabel : item.label;
  const aria = active ? (item.activeAria ?? label) : (item.inactiveAria ?? label);
  const icon = active && item.activeIcon ? item.activeIcon : item.icon;
  return { label, aria, icon };
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
    <span aria-hidden="true">{item.icon}</span>
    {showLabel ? <span>{item.label}</span> : null}
    {visibleCount !== undefined ? <span className={countClassName}>{visibleCount}</span> : null}
  </button>;
}

export function UniversalActionLink({ action, href, active = false, className, count, countClassName, showLabel = false, ariaLabel, title, prefetch = false, target, rel }: CommonActionProps & { href: string; prefetch?: boolean; target?: string; rel?: string }) {
  const item = presentation(action, active);
  const visibleCount = action === "wishLocker" ? undefined : count;
  return <Link className={className} href={href} prefetch={prefetch} target={target} rel={rel} aria-label={ariaLabel ?? item.aria} title={title ?? item.label}>
    <span aria-hidden="true">{item.icon}</span>
    {showLabel ? <span>{item.label}</span> : null}
    {visibleCount !== undefined ? <span className={countClassName}>{visibleCount}</span> : null}
  </Link>;
}

export function UniversalActionSummary({ action = "report", active = false, className, showLabel = false, ariaLabel, title }: Pick<CommonActionProps, "active" | "className" | "showLabel" | "ariaLabel" | "title"> & { action?: UniversalActionKind }) {
  const item = presentation(action, active);
  return <summary className={className} aria-label={ariaLabel ?? item.aria} title={title ?? item.label}>
    <span aria-hidden="true">{item.icon}</span>{showLabel ? <span>{item.label}</span> : null}
  </summary>;
}
