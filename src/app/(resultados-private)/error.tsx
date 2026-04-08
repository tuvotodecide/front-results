"use client";

type ResultadosPrivateErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ResultadosPrivateError({
  error,
  reset,
}: ResultadosPrivateErrorProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold text-gray-900">
        No se pudo cargar la vista privada de resultados.
      </h1>
      <p className="max-w-md text-sm text-gray-600">
        {error.message || "Ocurrió un error inesperado al renderizar la ruta."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-[#006237] px-4 py-2 text-sm font-medium text-white"
      >
        Reintentar
      </button>
    </main>
  );
}
