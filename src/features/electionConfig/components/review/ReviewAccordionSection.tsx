import React, { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

type ReviewAccordionSectionProps = {
  title: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

const ReviewAccordionSection: React.FC<ReviewAccordionSectionProps> = ({
  title,
  children,
  badge,
  defaultOpen = false,
  className = "",
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = `review-section-${title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;

  return (
    <section
      className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-gray-50 sm:px-5"
        >
          <span className="min-w-0">
            <span className="block text-base font-semibold text-gray-900">
              {title}
            </span>
            {badge ? <span className="mt-2 block">{badge}</span> : null}
          </span>
          <span
            aria-hidden="true"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 text-lg text-gray-500 transition ${
              open ? "rotate-180 bg-[#EFF7F0] text-[#2E6A38]" : "bg-white"
            }`}
          >
            <ChevronDownIcon className="h-4 w-4" />
          </span>
        </button>
      </h2>
      {open ? (
        <div id={contentId} className="border-t border-gray-100 px-4 py-4 sm:px-5">
          {children}
        </div>
      ) : null}
    </section>
  );
};

export default ReviewAccordionSection;
