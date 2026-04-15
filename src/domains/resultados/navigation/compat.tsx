"use client";

import NextLink from "next/link";
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
} from "next/navigation";
import type { ComponentProps } from "react";
import { useCallback, useMemo } from "react";
import { emitNavigationStart } from "@/shared/system/navigationFeedback";

type SearchParamsInput =
  | string
  | string[][]
  | Record<string, string>
  | URLSearchParams;

const buildSearchParams = (value: SearchParamsInput) => {
  if (value instanceof URLSearchParams) {
    return new URLSearchParams(value.toString());
  }

  if (typeof value === "string" || Array.isArray(value)) {
    return new URLSearchParams(value);
  }

  const params = new URLSearchParams();
  Object.entries(value).forEach(([key, entry]) => {
    params.set(key, entry);
  });
  return params;
};

export const useLocation = () => {
  const pathname = usePathname() ?? "";
  const searchParams = useNextSearchParams();
  const search = searchParams?.toString() ?? "";

  return useMemo(
    () => ({
      pathname,
      search: search ? `?${search}` : "",
      hash: "",
      state: null,
      key: `${pathname}${search}`,
    }),
    [pathname, search],
  );
};

export const useSearchParams = () => {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const nextSearchParams = useNextSearchParams();
  const search = nextSearchParams?.toString() ?? "";

  const searchParams = useMemo(() => new URLSearchParams(search), [search]);

  const setSearchParams = useCallback(
    (value: SearchParamsInput) => {
      const params = buildSearchParams(value);
      const query = params.toString();
      const currentUrl = search ? `${pathname}?${search}` : pathname;
      const nextUrl = query ? `${pathname}?${query}` : pathname;

      if (nextUrl === currentUrl) {
        return;
      }

      if (typeof window !== "undefined") {
        window.history.replaceState(window.history.state, "", nextUrl);
        return;
      }

      router.replace(nextUrl, { scroll: false });
    },
    [pathname, router, search],
  );

  return [searchParams, setSearchParams] as const;
};

export const useNavigate = () => {
  const router = useRouter();

  return useCallback(
    (to: number | string) => {
      if (typeof to === "number") {
        if (to === -1) {
          router.back();
        }
        return;
      }

      emitNavigationStart();
      router.push(to, { scroll: false });
    },
    [router],
  );
};

export const useParams = <
  T extends Record<string, string | string[] | undefined> = Record<
    string,
    string | string[] | undefined
  >,
>() => useNextParams() as T;

type LinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & {
  to: string;
  state?: unknown;
};

export const Link = ({ to, scroll = false, state, ...props }: LinkProps) => {
  void state;
  return <NextLink href={to} scroll={scroll} {...props} />;
};
