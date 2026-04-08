import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
        404
      </p>
      <h1 className="text-2xl font-semibold text-gray-900">
        La ruta solicitada no existe.
      </h1>
      <p className="max-w-md text-sm text-gray-600">
        Verifica la URL o vuelve a una vista canónica del sistema.
      </p>
      <Link
        href="/resultados"
        className="rounded-md bg-[#006237] px-4 py-2 text-sm font-medium text-white"
      >
        Ir a resultados
      </Link>
    </main>
  );
}
