"use client";

import type { ButtonHTMLAttributes } from "react";
import { useRouter } from "next/navigation";

interface BrowserBackButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  to?: string;
}

export default function BrowserBackButton({
  className = "",
  to,
  title = "Volver",
  ...rest
}: Readonly<BrowserBackButtonProps>) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (to) {
          const url = new URL(to, window.location.origin);
          router.push(`${url.pathname}${url.search}${url.hash}`);
          return;
        }

        router.back();
      }}
      className={`rounded-full p-2 transition-colors duration-200 hover:bg-gray-100 ${className}`}
      title={title}
      {...rest}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-gray-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </button>
  );
}
