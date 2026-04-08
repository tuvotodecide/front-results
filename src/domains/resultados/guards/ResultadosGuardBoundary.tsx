"use client";

import { Component } from "react";

interface ResultadosGuardBoundaryProps {
  children: React.ReactNode;
  access: "public" | "private";
}

type BoundaryState = {
  hasError: boolean;
};

class ResultadosRuntimeBoundary extends Component<
  ResultadosGuardBoundaryProps,
  BoundaryState
> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch() {
    // Route-level error.tsx handles the main error UX; this is a last-resort
    // client fallback to avoid rendering an empty tree.
  }

  private readonly handleRetry = () => {
    this.setState({ hasError: false });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-xl font-semibold text-gray-900">
            No se pudo renderizar la vista de resultados.
          </h1>
          <p className="max-w-md text-sm text-gray-600">
            Se activó el boundary de runtime para la vista {this.props.access}.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="rounded-md bg-[#006237] px-4 py-2 text-sm font-medium text-white"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function ResultadosGuardBoundary(
  props: ResultadosGuardBoundaryProps,
) {
  return <ResultadosRuntimeBoundary {...props} />;
}
