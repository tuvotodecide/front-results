"use client";

import NextLink from "next/link";
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import type { ReactNode } from "react";

interface LinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export function Link({ to, children, className, onClick }: LinkProps) {
  return (
    <NextLink href={to} className={className} onClick={onClick}>
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();

  return (to: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      router.replace(to);
      return;
    }

    router.push(to);
  };
}

export function useParams<T extends Record<string, string | string[] | undefined>>() {
  return useNextParams() as T;
}

export function useLocation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  return {
    pathname,
    search: search ? `?${search}` : "",
    hash: "",
    state: null,
    key: pathname,
  };
}
