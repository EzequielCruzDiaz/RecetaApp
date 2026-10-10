"use client";

import { useEffect } from "react";
import { EmptyState } from "@/components/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      title="Algo salió mal"
      hint={error.message || "Ocurrió un error inesperado. Podés intentar de nuevo."}
      actionLabel="Reintentar"
      onAction={reset}
    />
  );
}
