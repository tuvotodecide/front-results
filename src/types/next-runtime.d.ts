declare module "next/link" {
  import type { AnchorHTMLAttributes, ReactNode } from "react";

  export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    children?: ReactNode;
  }

  export default function Link(props: LinkProps): JSX.Element;
}

declare module "next/navigation" {
  export interface AppRouterInstance {
    push(href: string): void;
    replace(href: string): void;
    back(): void;
  }

  export interface ReadonlyURLSearchParams {
    get(name: string): string | null;
    toString(): string;
  }

  export function useRouter(): AppRouterInstance;
  export function usePathname(): string;
  export function useSearchParams(): ReadonlyURLSearchParams;
}

declare module "next/image" {
  import type { ImgHTMLAttributes } from "react";

  export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    src: string | { src: string };
    alt: string;
    priority?: boolean;
  }

  export default function Image(props: ImageProps): JSX.Element;
}
