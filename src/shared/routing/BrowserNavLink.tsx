"use client";

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface BrowserNavLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  children: ReactNode;
}

const isModifiedEvent = (event: MouseEvent<HTMLAnchorElement>) =>
  event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

export default function BrowserNavLink({
  href,
  children,
  onClick,
  target,
  ...rest
}: Readonly<BrowserNavLinkProps>) {
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      isModifiedEvent(event) ||
      event.button !== 0 ||
      target === "_blank" ||
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    ) {
      return;
    }

    event.preventDefault();

    const url = new URL(href, window.location.origin);
    router.push(`${url.pathname}${url.search}${url.hash}`);
  };

  return (
    <a href={href} onClick={handleClick} target={target} {...rest}>
      {children}
    </a>
  );
}
