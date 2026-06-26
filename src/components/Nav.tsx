import Link from "next/link";
import { Button } from "@/components/ui/Button";

/** Slim premium nav — monogram, restrained menu, the one CTA. */
export function Nav() {
  return (
    <header>
      <div className="wrap">
        <Link className="brand" href="/" data-cursor>
          <svg className="mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="ngmark" x1="20" y1="6" x2="20" y2="34" gradientUnits="userSpaceOnUse">
                <stop stopColor="#29c2ee" />
                <stop offset="1" stopColor="#0f6fb0" />
              </linearGradient>
            </defs>
            <path d="M20 6s10 11 10 18a10 10 0 1 1-20 0C10 17 20 6 20 6Z" fill="url(#ngmark)" />
          </svg>
          Next&nbsp;Gen
        </Link>
        <nav className="nav-links" aria-label="Primary">
          <a className="navlink" href="#system" data-cursor>
            The system
          </a>
          <a className="navlink" href="#benchmark" data-cursor>
            Performance
          </a>
          <a className="navlink" href="#process" data-cursor>
            How it works
          </a>
          <Button variant="ghost" href="#book">
            Book water test
          </Button>
        </nav>
      </div>
    </header>
  );
}
