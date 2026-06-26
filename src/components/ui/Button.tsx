import Link from "next/link";

type Variant = "primary" | "ghost";

type Props = {
  variant?: Variant;
  href?: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
};

/** Calm premium button — solid ice (primary) or hairline ghost. */
export function Button({ variant = "primary", href, children, className = "", ariaLabel }: Props) {
  const cls = `btn ${variant === "primary" ? "btn-primary" : "btn-ghost"} ${className}`.trim();
  if (href) {
    const external = /^(tel:|mailto:|https?:)/.test(href);
    if (external) {
      return (
        <a className={cls} href={href} data-cursor aria-label={ariaLabel}>
          {children}
        </a>
      );
    }
    return (
      <Link className={cls} href={href} data-cursor aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} data-cursor aria-label={ariaLabel}>
      {children}
    </button>
  );
}
