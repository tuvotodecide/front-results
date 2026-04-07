import { routeDomains } from "@/shared/routing/domains";

export default function FrontendRuntimeNotice() {
  const domains = Object.entries(routeDomains) as Array<
    [keyof typeof routeDomains, (typeof routeDomains)[keyof typeof routeDomains]]
  >;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-14 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Frontend Web
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Tu Voto Decide
          </h1>
          <p className="max-w-3xl text-sm text-slate-300 sm:text-base">
            Aplicacion web principal con App Router, dominios funcionales y rutas
            operativas para votacion, resultados y administracion.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          {domains.map(([key, domain]) => (
            <article
              key={key}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.28)]"
            >
              <h2 className="text-lg font-semibold text-white">{domain.label}</h2>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                Rutas disponibles
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                {domain.paths.map((path) => (
                  <li key={path} className="rounded-lg border border-white/8 bg-black/20 px-3 py-2">
                    {path}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
