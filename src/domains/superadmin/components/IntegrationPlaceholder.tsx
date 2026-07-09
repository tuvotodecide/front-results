import { PlugZap } from "lucide-react";
import SuperadminPageHeader from "./SuperadminPageHeader";

export default function IntegrationPlaceholder({
  title,
  subtitle,
  description,
}: {
  title: string;
  subtitle: string;
  description: string;
}) {
  return (
    <section>
      <SuperadminPageHeader title={title} subtitle={subtitle} />
      <div className="rounded-2xl border border-[#e2e7e2] bg-white p-6 shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e7f2e8] text-[#287c36]">
            <PlugZap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#3b3b3b]">
              Integración preparada
            </h2>
            <p className="mt-1 text-sm text-[#747474]">{description}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
